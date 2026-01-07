package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/notnil/chess"
	"github.com/yashgadle/go-chess/client"
	"github.com/yashgadle/go-chess/utils"
)

type GameType struct {
	Color string `json:"color"`
	Time  string `json:"time"`
}

type CreateGameResponse struct {
	GameUrl   string `json:"gameUrl"`
	InviteUrl string `json:"inviteUrl"`
}

func CreateGame(w http.ResponseWriter, r *http.Request) {
	var gameSettings GameType

	gameId := uuid.NewString()
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error parsing body", http.StatusBadRequest)
		return
	}

	if err := json.Unmarshal(body, &gameSettings); err != nil {
		http.Error(w, "Error parsing body", http.StatusBadRequest)
		return
	}

	chess := chess.NewGame()
	exp := 24 * time.Hour
	cache := client.RedisCache{
		Users: []client.User{},
		Board: chess.FEN(),
	}
	err = client.SetVal(r.Context(), gameId, cache, &exp)
	if err != nil {
		http.Error(w, "Error Writing to Redis", http.StatusInternalServerError)
		return
	}

	opponentColor := map[string]string{"w": "b", "b": "w"}[gameSettings.Color]
	if opponentColor == "" {
		opponentColor = "b"
	}
	startGameUrl := fmt.Sprintf("/joinGame/%s?color=%s&time=%s", gameId, gameSettings.Color, gameSettings.Time)
	inviteUrl := fmt.Sprintf("/joinGame/%s?color=%s&time=%s", gameId, opponentColor, gameSettings.Time)

	w.Header().Set("content-type", "application/json")
	json.NewEncoder(w).Encode(CreateGameResponse{
		GameUrl:   startGameUrl,
		InviteUrl: inviteUrl,
	})
}

func JoinGame(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameId := vars["gameId"]

	if gameId == "" {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}
	gameCache, err := client.GetVal(r.Context(), gameId)
	if err != nil {
		http.Error(w, "Error Reading from Redis", http.StatusInternalServerError)
		return
	}

	timeControl := r.URL.Query().Get("time")
	color := r.URL.Query().Get("color")
	timeMs := utils.GetTime(utils.TimeControl(timeControl))
	currentUsersInGame := gameCache.Users

	if len(currentUsersInGame) == 2 {
		http.Error(w, "2 players already joined", http.StatusForbidden)
		return
	}

	userId, err := utils.GetGuestSession(r)
	if err != nil || userId == "" {
		userId = utils.SetGuestSession(w, r)
	}

	push := true
	for _, u := range currentUsersInGame {
		if u.Id == userId {
			push = false
		}
	}

	if push || len(currentUsersInGame) == 0 {
		currentUsersInGame = append(currentUsersInGame, client.User{
			Id:    userId,
			Color: color,
		})
		newCache := client.RedisCache{
			Users:        currentUsersInGame,
			Board:        gameCache.Board,
			WhiteTimeMs:  timeMs,
			BlackTimeMs:  timeMs,
			LastMoveAtMs: 0,
		}

		err := client.SetVal(r.Context(), gameId, newCache, nil)
		if err != nil {
			http.Error(w, "Error Writing to Redis", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusOK)
}

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	_, err := client.Redis()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "unhealthy",
			"error":  "Redis connection failed",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}
