package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/yashgadle/go-chess/common"
	"github.com/yashgadle/go-chess/routes"
)

/*
Embed frontend build output
IMPORTANT:
- frontend/dist MUST exist at build time
*/

var embeddedFiles embed.FS

// Holds client connections
var GM = common.NewGameManager()

func main() {
	// Initialize pub/sub manager for cross-instance communication
	routes.GetPubSubManager(GM)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env vars")
	}

	appEnv := os.Getenv("APP_ENV")

	r := mux.NewRouter()

	r.HandleFunc("/api/createGame", routes.CreateGame).Methods("POST")
	r.HandleFunc("/api/joinGame/{gameId}", routes.JoinGame).Methods("GET")
	r.PathPrefix("/ws/game/{gameId}").HandlerFunc(routes.WSEndpoint(GM))

	staticFS, err := fsSub(embeddedFiles, "frontend/dist")
	if err != nil {
		log.Fatal(err)
	}

	fileServer := http.FileServer(staticFS)
	r.PathPrefix("/").Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If requesting a file that doesn't exist, serve index.html
		if !fileExists(staticFS, r.URL.Path) {
			r.URL.Path = "/index.html"
		}
		fileServer.ServeHTTP(w, r)
	}))

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

func fsSub(fsys embed.FS, dir string) (http.FileSystem, error) {
	sub, err := fs.Sub(fsys, dir)
	if err != nil {
		return nil, err
	}
	return http.FS(sub), nil
}

func fileExists(fsys http.FileSystem, path string) bool {
	if path == "/" {
		path = "/index.html"
	}
	path = strings.TrimPrefix(path, "/")
	_, err := fsys.Open(path)
	return err == nil
}
