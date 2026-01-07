package routes

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
	"github.com/yashgadle/go-chess/client"
	"github.com/yashgadle/go-chess/common"
	"github.com/yashgadle/go-chess/utils"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func WSEndpoint(gm *common.GameManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		upgrader.CheckOrigin = func(r *http.Request) bool {
			appEnv := os.Getenv("APP_ENV")

			if appEnv == "development" {
				return true
			}

			origin := r.Header.Get("Origin")
			host := "https://" + r.Host

			return origin == host
		}

		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Failed to upgrade")
		}

		vars := mux.Vars(r)
		gameId := vars["gameId"]
		userId, err := utils.GetGuestSession(r)

		if err != nil || userId == "" {
			ws.Close()
			return
		}

		if gameId == "" {
			ws.Close()
			return
		}

		val, err := client.GetVal(r.Context(), gameId)
		if err != nil {
			log.Println("Game not found")
			return
		}

		var user client.User
		for _, u := range val.Users {
			if u.Id == userId {
				user = u
			}
		}

		player := &common.Player{
			Id:    userId,
			Color: common.PlayerColor(user.Color),
			Conn:  ws,
			Send:  make(chan []byte, 16),
		}

		utils.StartWriter(player)

		// Client connected
		utils.WriteSignal(player, common.MsgSignal, common.SignalPayload{
			Message: "connected",
		})

		// Subscribe to game events via pub/sub
		psm := GetPubSubManager(gm)
		psm.SubscribeToGame(gameId)

		gameManager(player, gameId, val.Board, gm)
		handleIncomingMessage(ws, r, gameId, userId)
	}
}

func handleIncomingMessage(conn *websocket.Conn, r *http.Request, gameId string, userId string) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		var WSMessage common.WSMessage
		err = json.Unmarshal(message, &WSMessage)
		if err != nil {
			log.Println(err)
			return
		}

		gameCache, err := client.GetVal(r.Context(), gameId)
		if err != nil {
			log.Println("Game not found")
			return
		}

		// Move
		if WSMessage.Type == common.MsgMove {
			var movePayload common.MovePayload
			json.Unmarshal(WSMessage.Data, &movePayload)

			fenFunc, err := chess.FEN(gameCache.Board)
			if err != nil {
				log.Println("Invalid FEN")
				return
			}

			game := chess.NewGame(fenFunc, chess.UseNotation(chess.UCINotation{}))
			err = game.MoveStr(movePayload.FromSquare + movePayload.ToSquare)
			if err != nil {
				// invalid move probably
				log.Println(err)
				return
			}

			client.SetVal(r.Context(), gameId, client.RedisCache{
				Users:        gameCache.Users,
				Board:        game.FEN(),
				WhiteTimeMs:  gameCache.WhiteTimeMs, //TODO: add time logic
				BlackTimeMs:  gameCache.BlackTimeMs, //TODO: add time logic
				LastMoveAtMs: gameCache.LastMoveAtMs,
			}, nil)

			// Publish move event to Redis pub/sub
			event := common.PubSubEvent{
				Type:       common.MsgMove,
				GameId:     gameId,
				FromUserId: userId,
			}
			event.Data = WSMessage.Data
			eventBytes, _ := json.Marshal(event)
			client.PublishGameEvent(r.Context(), gameId, eventBytes)
		}
	}
}

func gameManager(player *common.Player, gameId string, board string, gm *common.GameManager) {
	game := gm.GetOrCreateGame(gameId, board)
	game.AddPlayer(player)

	if game.White != nil && game.Black != nil {
		// both players connected. start game
		startGamePayload := common.StartGamePayload{
			Board: board,
		}

		// Publish start_game event to Redis pub/sub
		event := common.PubSubEvent{
			Type:   common.MsgStartGame,
			GameId: gameId,
		}
		eventData, _ := json.Marshal(startGamePayload)
		event.Data = eventData
		eventBytes, _ := json.Marshal(event)
		client.PublishGameEvent(client.Ctx, gameId, eventBytes)
	}
}

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
		go pubSubManager.startSubscriber()
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
	go psm.handleSubscription(gameId, pubsub)
}

func (psm *PubSubManager) handleSubscription(gameId string, pubsub *redis.PubSub) {
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

			psm.forwardEvent(event)
		}
	}
}

func (psm *PubSubManager) startSubscriber() {
	// This function is kept for initialization, but actual subscription handling
	// is done in handleSubscription goroutines
	<-psm.ctx.Done()
}

func (psm *PubSubManager) forwardEvent(event common.PubSubEvent) {
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

		// Create WSMessage and send
		wsMsg := common.WSMessage{
			Type: event.Type,
			Data: event.Data,
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
