package utils

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
	"github.com/yashgadle/go-chess/common"
)

func WriteSignal(p *common.Player, msgType common.MessageType, message any) {
	var payload json.RawMessage

	switch m := message.(type) {
	case nil:
		// leave payload nil
	case json.RawMessage:
		payload = m
	default:
		b, err := json.Marshal(m)
		if err != nil {
			log.Println(err)
			return
		}
		payload = b
	}

	data, err := json.Marshal(common.WSMessage{
		Type: msgType,
		Data: payload,
	})

	if err != nil {
		log.Println(err)
		return
	}

	p.Send <- data
}

// Only one writer per connection. gorilla/websocket does not support multiple writers.
func StartWriter(p *common.Player) {
	go func() {
		for msg := range p.Send {
			err := p.Conn.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				log.Println(err)
				return
			}
		}
	}()
}
