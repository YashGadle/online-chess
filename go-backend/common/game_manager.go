package common

import (
	"sync"
)

type GameManager struct {
	mu    sync.Mutex
	Games map[string]*Game
}

func NewGameManager() *GameManager {
	return &GameManager{
		Games: make(map[string]*Game),
	}
}

func (gm *GameManager) GetOrCreateGame(gameId string, board string) *Game {
	gm.mu.Lock()
	defer gm.mu.Unlock()

	game := gm.Games[gameId]
	if game == nil {
		game = &Game{
			Id:    gameId,
			Board: board,
		}
		gm.Games[gameId] = game
	}
	return game
}
