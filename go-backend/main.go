package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/yashgadle/go-chess/routes"
	"github.com/yashgadle/go-chess/utils"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	userId, _ := utils.GetGuestSession(r)
	log.Println(userId)
	if err != nil {
		log.Println("Failed to upgrade")
	}

	err = ws.WriteMessage(1, []byte("Successfully connected"))
	if err != nil {
		log.Println(err)
		return
	}
	log.Println("Client Connected")
	reader(ws)
}

func reader(conn *websocket.Conn) {
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		fmt.Println(string(p))

		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Println(err)
			return
		}
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env vars")
	}

	appEnv := os.Getenv("APP_ENV")

	r := mux.NewRouter()

	r.HandleFunc("/api/createGame", routes.CreateGame).Methods("POST")
	r.HandleFunc("/api/joinGame/{gameId}", routes.JoinGame).Methods("GET")
	r.PathPrefix("/ws/").HandlerFunc(wsEndpoint)

	handler := http.Handler(r)

	if appEnv == "development" {
		log.Println("DEV mode detected (Render): enabling CORS")

		c := cors.New(cors.Options{
			AllowedOrigins: []string{
				"http://localhost:5173",
			},
			AllowedMethods: []string{
				"GET", "POST", "PUT", "DELETE", "OPTIONS",
			},
			AllowedHeaders: []string{
				"Content-Type",
				"Authorization",
			},
			AllowCredentials: true,
		})

		handler = c.Handler(r)
	} else {
		log.Println("PROD mode detected: CORS disabled or restricted")
	}

	log.Fatal(http.ListenAndServe(":5001", handler))
}
