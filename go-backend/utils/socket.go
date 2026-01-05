package utils

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gorilla/websocket"
	"github.com/yashgadle/go-chess/common"
)

func WriteSignal(p *common.Player, msgType common.MessageType, message any) {
	payload, _ := json.Marshal(common.SignalPayload{Message: fmt.Sprint(message)})
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
