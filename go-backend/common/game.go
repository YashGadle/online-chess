package common

import "sync"

type Game struct {
	Id    string
	White *Player
	Black *Player
	Board string
	mu    sync.Mutex // lock needed
}

func (g *Game) AddPlayer(p *Player) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if p.Color == "w" && g.White == nil {
		g.White = p
	}

	if p.Color == "b" && g.Black == nil {
		g.Black = p
	}
}
