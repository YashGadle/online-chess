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

//go:embed frontend/dist/*
var embeddedFiles embed.FS

var GM = common.NewGameManager()

func main() {
	// Initialize application
	initApp()

	// Setup routes
	router := setupRoutes()

	// Apply middleware
	handler := applyMiddleware(router)

	// Start server
	startServer(handler)
}

// initApp initializes application dependencies
func initApp() {
	routes.GetPubSubManager(GM)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env vars")
	}
}

// setupRoutes configures all HTTP routes
// Order matters: specific routes must come before catch-all routes
func setupRoutes() *mux.Router {
	router := mux.NewRouter()

	// WebSocket routes (must come before static routes to avoid conflicts)
	setupWebSocketRoutes(router)

	// API routes
	setupAPIRoutes(router)

	// Static file serving (must be last - catch-all)
	setupStaticRoutes(router)

	return router
}

// setupAPIRoutes registers all API endpoints
func setupAPIRoutes(router *mux.Router) {
	router.HandleFunc("/api/health", routes.HealthCheck).Methods("GET")
	router.HandleFunc("/api/createGame", routes.CreateGame).Methods("POST")
	router.HandleFunc("/api/joinGame/{gameId}", routes.JoinGame).Methods("GET")
}

// setupWebSocketRoutes registers WebSocket endpoints
func setupWebSocketRoutes(router *mux.Router) {
	// Create a subrouter for /ws paths to properly extract route variables
	wsRouter := router.PathPrefix("/ws").Subrouter()
	wsRouter.HandleFunc("/game/{gameId}", routes.WSEndpoint(GM))
}

// setupStaticRoutes configures static file serving for the frontend SPA
func setupStaticRoutes(router *mux.Router) {
	staticFS, err := createStaticFileSystem()
	if err != nil {
		log.Fatal("Failed to create static file system: ", err)
	}

	logEmbeddedFiles()

	// Create SPA handler with static file system
	spaHandler := createSPAHandler(staticFS)

	// Register catch-all route for static files (excluding API and WebSocket routes)
	router.PathPrefix("/").MatcherFunc(func(req *http.Request, match *mux.RouteMatch) bool {
		return !strings.HasPrefix(req.URL.Path, "/api/") && !strings.HasPrefix(req.URL.Path, "/ws/")
	}).Handler(spaHandler)
}

// createStaticFileSystem creates an http.FileSystem from embedded files
func createStaticFileSystem() (http.FileSystem, error) {
	sub, err := fs.Sub(embeddedFiles, "frontend/dist")
	if err != nil {
		return nil, err
	}
	return http.FS(sub), nil
}

// logEmbeddedFiles logs information about embedded files for debugging
func logEmbeddedFiles() {
	entries, err := fs.ReadDir(embeddedFiles, "frontend/dist")
	if err != nil {
		log.Printf("Warning: Could not read embedded files: %v", err)
		return
	}

	log.Printf("Embedded files count: %d", len(entries))
	if len(entries) > 0 {
		maxShow := min(3, len(entries))
		log.Printf("Sample embedded files:")
		for i := 0; i < maxShow; i++ {
			log.Printf("  - %s", entries[i].Name())
		}
	}
}

// createSPAHandler creates an HTTP handler for serving SPA static files
// with proper fallback to index.html for client-side routing
func createSPAHandler(staticFS http.FileSystem) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		path := normalizePath(req.URL.Path)

		// Safety check: reject API and WebSocket routes
		if strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/ws/") {
			http.NotFound(w, req)
			return
		}

		// Determine which file to serve
		fsPath := determineFilePath(staticFS, path)

		// Serve the file
		serveFile(w, req, staticFS, fsPath)
	})
}

// normalizePath normalizes the request path (removes trailing slashes)
func normalizePath(path string) string {
	if path != "/" && strings.HasSuffix(path, "/") {
		return strings.TrimSuffix(path, "/")
	}
	return path
}

// determineFilePath determines which file to serve based on the path
// Falls back to index.html for SPA routing if file doesn't exist
func determineFilePath(staticFS http.FileSystem, path string) string {
	// Root path serves index.html
	if path == "/" {
		return "index.html"
	}

	// Check if requested file exists
	if fileExists(staticFS, path) {
		return strings.TrimPrefix(path, "/")
	}

	// File doesn't exist - fallback to index.html for SPA routing
	return "index.html"
}

// serveFile serves a file from the embedded filesystem
func serveFile(w http.ResponseWriter, req *http.Request, staticFS http.FileSystem, fsPath string) {
	file, err := staticFS.Open(fsPath)
	if err != nil {
		log.Printf("Error opening file %s: %v", fsPath, err)
		http.NotFound(w, req)
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		log.Printf("Error getting file stat for %s: %v", fsPath, err)
		http.NotFound(w, req)
		return
	}

	// Set Content-Type header
	setContentType(w, fsPath)

	// Serve the file
	http.ServeContent(w, req, stat.Name(), stat.ModTime(), file)
}

// setContentType sets the appropriate Content-Type header based on file extension
func setContentType(w http.ResponseWriter, filePath string) {
	switch {
	case strings.HasSuffix(filePath, ".html"):
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
	case strings.HasSuffix(filePath, ".js"):
		w.Header().Set("Content-Type", "application/javascript")
	case strings.HasSuffix(filePath, ".css"):
		w.Header().Set("Content-Type", "text/css")
	case strings.HasSuffix(filePath, ".json"):
		w.Header().Set("Content-Type", "application/json")
	case strings.HasSuffix(filePath, ".png"):
		w.Header().Set("Content-Type", "image/png")
	case strings.HasSuffix(filePath, ".jpg"), strings.HasSuffix(filePath, ".jpeg"):
		w.Header().Set("Content-Type", "image/jpeg")
	case strings.HasSuffix(filePath, ".svg"):
		w.Header().Set("Content-Type", "image/svg+xml")
	}
}

// fileExists checks if a file exists in the filesystem
func fileExists(fsys http.FileSystem, path string) bool {
	if path == "/" {
		path = "/index.html"
	}
	fsPath := strings.TrimPrefix(path, "/")
	_, err := fsys.Open(fsPath)
	return err == nil
}

// applyMiddleware applies CORS and other middleware based on environment
func applyMiddleware(router *mux.Router) http.Handler {
	appEnv := os.Getenv("APP_ENV")

	if appEnv == "development" {
		log.Println("DEV mode detected: enabling CORS")
		return createCORSHandler(router)
	}

	log.Println("PROD mode detected: CORS disabled or restricted")
	return router
}

// createCORSHandler creates a CORS-enabled handler for development
func createCORSHandler(router *mux.Router) http.Handler {
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
	return c.Handler(router)
}

// startServer starts the HTTP server
func startServer(handler http.Handler) {
	port := getPort()
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}

// getPort returns the port to listen on, defaulting to 5001
func getPort() string {
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	return "5001"
}
