package common

import (
	"encoding/json"
)

type MessageType string

const (
	MsgSignal     MessageType = "signal"
	MsgStartGame  MessageType = "start_game"
	MsgStartClock MessageType = "start_clock"
	MsgMove       MessageType = "move"
	MsgTimeSync   MessageType = "time_sync"
)

type SignalPayload struct {
	Message string `json:"message"`
}

type MovePayload struct {
	FromSquare string `json:"fromSquare"`
	ToSquare   string `json:"toSquare"`
}

type StartGamePayload struct {
	// empty
}

type TimePayload struct {
	WhiteTimeMs int64 `json:"whiteTimeMs"`
	BlackTimeMs int64 `json:"blackTimeMs"`
}

type WSMessage struct {
	Type MessageType     `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}
