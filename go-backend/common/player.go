package common

import "github.com/gorilla/websocket"

type PlayerColor string

const (
	White PlayerColor = "w"
	Black PlayerColor = "b"
)

type Player struct {
	Id    string
	Color PlayerColor
	Conn  *websocket.Conn
	Send  chan []byte
}
