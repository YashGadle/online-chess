package routes

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

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
	// Client connection handler
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
			ws.Close()
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

		gameManager(player, gameId, val.Board, gm)

		// Subscribe to game events via pub/sub
		psm := utils.GetPubSubManager(gm)
		psm.SubscribeToGame(gameId)

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

			//	Clock logic
			now := time.Now().UnixMilli()
			turn := game.Position().Turn()
			whiteTimeMs := gameCache.WhiteTimeMs
			blackTimeMs := gameCache.BlackTimeMs
			lastMoveAtMs := now

			// Handle first move (LastMoveAtMs is 0) - don't deduct time
			if gameCache.LastMoveAtMs == 0 {
				// First move: just set the timestamp, don't deduct time
				client.UpdateVal(r.Context(), gameId, client.UpdateOptions{
					LastMoveAtMs: &lastMoveAtMs,
				}, nil)
			} else {
				// Calculate move time for subsequent moves
				moveTimeMs := now - gameCache.LastMoveAtMs

				if turn == chess.White {
					if moveTimeMs > gameCache.WhiteTimeMs {
						log.Println("White lost on time")
						gameEnd := true
						whiteTimeMs = int64(0)
						board := game.FEN()
						client.UpdateVal(r.Context(), gameId, client.UpdateOptions{
							Board:        &board,
							GameEnd:      &gameEnd,
							WhiteTimeMs:  &whiteTimeMs,
							LastMoveAtMs: &lastMoveAtMs,
						}, nil)
						return
					}

					whiteTimeMs -= moveTimeMs
				} else {
					if moveTimeMs > gameCache.BlackTimeMs {
						log.Println("Black lost on time")
						gameEnd := true
						blackTimeMs := int64(0)
						board := game.FEN()
						client.UpdateVal(r.Context(), gameId, client.UpdateOptions{
							Board:        &board,
							GameEnd:      &gameEnd,
							BlackTimeMs:  &blackTimeMs,
							LastMoveAtMs: &lastMoveAtMs,
						}, nil)
						return
					}
					blackTimeMs -= moveTimeMs
				}
			}

			// Make move
			err = game.MoveStr(movePayload.FromSquare + movePayload.ToSquare)
			if err != nil {
				// invalid move probably
				log.Println(err)
				return
			}

			// Check if game has ended
			if game.Outcome() != chess.NoOutcome {
				log.Println("Game has ended")
				board := game.FEN()
				gameEnd := true
				client.UpdateVal(r.Context(), gameId, client.UpdateOptions{
					Board:        &board,
					GameEnd:      &gameEnd,
					WhiteTimeMs:  &whiteTimeMs,
					BlackTimeMs:  &blackTimeMs,
					LastMoveAtMs: &lastMoveAtMs,
				}, nil)
			}

			board := game.FEN()
			client.UpdateVal(r.Context(), gameId, client.UpdateOptions{
				Board:        &board,
				WhiteTimeMs:  &whiteTimeMs,
				BlackTimeMs:  &blackTimeMs,
				LastMoveAtMs: &lastMoveAtMs,
			}, nil)

			// Publish move event to Redis pub/sub with clock times
			movePayloadWithTime := common.MovePayload{
				FromSquare:  movePayload.FromSquare,
				ToSquare:    movePayload.ToSquare,
				WhiteTimeMs: whiteTimeMs,
				BlackTimeMs: blackTimeMs,
			}
			moveData, _ := json.Marshal(movePayloadWithTime)
			event := common.PubSubEvent{
				Type:       common.MsgMove,
				GameId:     gameId,
				FromUserId: userId,
			}
			event.Data = moveData
			eventBytes, _ := json.Marshal(event)
			err = client.PublishGameEvent(r.Context(), gameId, eventBytes)
			if err != nil {
				log.Println("Error publishing move event to Redis pub/sub")
				return
			}
		}
	}
}

func gameManager(player *common.Player, gameId string, board string, gm *common.GameManager) {
	game := gm.GetOrCreateGame(gameId, board)
	game.AddPlayer(player)

	if game.White != nil && game.Black != nil {
		// both players connected. start game
		startGamePayload := common.StartGamePayload{
			Board:       board,
			PlayerColor: player.Color,
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
