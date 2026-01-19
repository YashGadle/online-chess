package utils

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/go-redis/redis/v8"
	"github.com/yashgadle/go-chess/client"
	"github.com/yashgadle/go-chess/common"
)

// PubSubManager manages Redis pub/sub subscriptions for games
type PubSubManager struct {
	gm     *common.GameManager
	subs   map[string]*redis.PubSub
	subsMu sync.RWMutex
	ctx    context.Context
	cancel context.CancelFunc
}

var pubSubManager *PubSubManager
var pubSubOnce sync.Once

func GetPubSubManager(gm *common.GameManager) *PubSubManager {
	pubSubOnce.Do(func() {
		ctx, cancel := context.WithCancel(context.Background())
		pubSubManager = &PubSubManager{
			gm:     gm,
			subs:   make(map[string]*redis.PubSub),
			ctx:    ctx,
			cancel: cancel,
		}
		go pubSubManager.StartSubscriber()
	})
	return pubSubManager
}

func (psm *PubSubManager) SubscribeToGame(gameId string) {
	psm.subsMu.Lock()
	defer psm.subsMu.Unlock()

	if _, exists := psm.subs[gameId]; exists {
		return // already subscribed
	}

	pubsub, err := client.SubscribeToGame(psm.ctx, gameId)
	if err != nil {
		log.Printf("Failed to subscribe to game %s: %v", gameId, err)
		return
	}

	psm.subs[gameId] = pubsub
	log.Printf("Subscribed to game channel: game:%s", gameId)

	// Start a goroutine to handle messages for this subscription
	go psm.HandleSubscription(gameId, pubsub)
}

func (psm *PubSubManager) HandleSubscription(gameId string, pubsub *redis.PubSub) {
	ch := pubsub.Channel()
	for {
		select {
		case <-psm.ctx.Done():
			return
		case msg, ok := <-ch:
			if !ok {
				log.Printf("Subscription channel closed for game %s", gameId)
				return
			}

			// Parse and forward event
			var event common.PubSubEvent
			if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
				log.Printf("Failed to unmarshal pub/sub event: %v", err)
				continue
			}

			psm.ForwardEvent(event)
		}
	}
}

func (psm *PubSubManager) StartSubscriber() {
	// This function is kept for initialization, but actual subscription handling
	// is done in handleSubscription goroutines
	<-psm.ctx.Done()
}

func (psm *PubSubManager) ForwardEvent(event common.PubSubEvent) {
	game := psm.gm.GetGame(event.GameId)

	if game == nil {
		return
	}

	// Forward to both players (they'll ignore if it's from themselves)
	var players []*common.Player
	if game.White != nil {
		players = append(players, game.White)
	}
	if game.Black != nil {
		players = append(players, game.Black)
	}

	for _, player := range players {
		// Skip if this event came from this player (avoid echo)
		if event.FromUserId != "" && player.Id == event.FromUserId {
			continue
		}

		// For start_game events, customize the payload with each player's color
		var dataToSend json.RawMessage = event.Data
		if event.Type == common.MsgStartGame {
			var startGamePayload common.StartGamePayload
			if err := json.Unmarshal(event.Data, &startGamePayload); err == nil {
				// Set the player's actual color instead of the generic one
				startGamePayload.PlayerColor = player.Color
				if customData, err := json.Marshal(startGamePayload); err == nil {
					dataToSend = customData
				}
			}
		}

		// Create WSMessage and send
		wsMsg := common.WSMessage{
			Type: event.Type,
			Data: dataToSend,
		}
		msgBytes, err := json.Marshal(wsMsg)
		if err != nil {
			log.Printf("Failed to marshal WSMessage: %v", err)
			continue
		}

		select {
		case player.Send <- msgBytes:
		default:
			log.Printf("Player %s send channel full, dropping message", player.Id)
		}
	}
}
