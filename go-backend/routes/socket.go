package routes

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

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

		redis, err := client.Redis()
		if err != nil {
			log.Println("Error getting Redis Client")
			return
		}

		val, err := client.GetVal(redis, r.Context(), gameId)
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
		gameManager(player, gameId, val.Board, gm)
		handleIncomingMessage(ws, r, gm, gameId, userId)
	}
}

func handleIncomingMessage(conn *websocket.Conn, r *http.Request, gm *common.GameManager, gameId string, userId string) {
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

		redis, err := client.Redis()
		if err != nil {
			log.Println("Error getting Redis Client")
			return
		}

		gameCache, err := client.GetVal(redis, r.Context(), gameId)
		if err != nil {
			log.Println("Game not found")
			return
		}

		var opponent client.User
		for _, u := range gameCache.Users {
			if u.Id != userId {
				opponent = u
			}
		}

		var opponentClient *common.Player
		if opponent.Color == "w" {
			opponentClient = gm.Games[gameId].White
		} else {
			opponentClient = gm.Games[gameId].Black
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
				log.Println(err)
				return
			}

			client.SetVal(redis, r.Context(), gameId, client.RedisCache{
				Users:        gameCache.Users,
				Board:        game.FEN(),
				WhiteTimeMs:  gameCache.WhiteTimeMs, //TODO: add time logic
				BlackTimeMs:  gameCache.BlackTimeMs, //TODO: add time logic
				LastMoveAtMs: gameCache.LastMoveAtMs,
			}, nil)

			utils.WriteSignal(opponentClient, common.MsgMove, movePayload)
		}
	}
}

func gameManager(player *common.Player, gameId string, board string, gm *common.GameManager) {
	game := gm.GetOrCreateGame(gameId, board)
	game.AddPlayer(player)

	if game.White != nil && game.Black != nil {
		// both players connected. start game
		utils.WriteSignal(game.White, common.MsgStartGame, common.StartGamePayload{
			Board: board,
		})
		utils.WriteSignal(game.Black, common.MsgStartGame, common.StartGamePayload{
			Board: board,
		})
	}
}
