// Package common Type defs for web socket
package common

import (
	"encoding/json"
)

type MessageType string

const (
	MsgSignal           MessageType = "signal"
	MsgStartGame        MessageType = "start_game"
	MsgStartClock       MessageType = "start_clock"
	MsgMove             MessageType = "move"
	MsgTimeSync         MessageType = "time_sync"
	MsgResign           MessageType = "resign"
	MsgDrawOffer        MessageType = "draw"
	MsgDrawAccept       MessageType = "draw_accept"
	MsgExplicitGameOver MessageType = "explicit_game_over"
)

type GOType string

const (
	Resignation     GOType = "resignation"
	DrawByAgreement GOType = "draw_by_agreement"
)

type ExplicitGameOverPayload struct {
	GameOverType GOType `json:"gameOverType"`
}

type SignalPayload struct {
	Message string `json:"message"`
	PGN     string `json:"pgn"`
}

type MovePayload struct {
	FromSquare  string `json:"fromSquare"`
	ToSquare    string `json:"toSquare"`
	WhiteTimeMs int64  `json:"whiteTimeMs,omitempty"`
	BlackTimeMs int64  `json:"blackTimeMs,omitempty"`
}

type StartGamePayload struct {
	PGN         string      `json:"pgn"`
	PlayerColor PlayerColor `json:"playerColor"`
}

type StartClockPayload struct {
	WhiteTimeMs  int64 `json:"whiteTimeMs"`
	BlackTimeMs  int64 `json:"blackTimeMs"`
	LastMoveAtMs int64 `json:"lastMoveAtMs,omitempty"`
}

type WSMessage struct {
	Type MessageType     `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}

// PubSubEvent represents an event published to Redis pub/sub
type PubSubEvent struct {
	Type       MessageType     `json:"type"`
	Data       json.RawMessage `json:"data,omitempty"`
	GameId     string          `json:"gameId"`
	FromUserId string          `json:"fromUserId,omitempty"` // to avoid echo back to sender
}
