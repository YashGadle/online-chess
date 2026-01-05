package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/yashgadle/go-chess/common"
	"github.com/yashgadle/go-chess/routes"
)

// Holds client connections
var GM = common.NewGameManager() //TODO: does not work with more than 1 instances

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env vars")
	}

	appEnv := os.Getenv("APP_ENV")

	r := mux.NewRouter()

	r.HandleFunc("/api/createGame", routes.CreateGame).Methods("POST")
	r.HandleFunc("/api/joinGame/{gameId}", routes.JoinGame).Methods("GET")
	r.PathPrefix("/ws/game/{gameId}").HandlerFunc(routes.WSEndpoint(GM))

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
