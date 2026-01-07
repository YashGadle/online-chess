# Project variables
APP_NAME := online-chess-go
BUILD_DIR := go-backend/bin
FRONTEND_DIR := frontend
BACKEND_DIR := go-backend
FRONTEND_DIST := $(FRONTEND_DIR)/dist
EMBEDDED_FRONTEND := $(BACKEND_DIR)/frontend/dist

.PHONY: all build build-frontend build-backend clean test run help

# Default target
all: build

help:
	@echo "Available targets:"
	@echo "  make build          - Build frontend and backend"
	@echo "  make build-frontend - Build only the frontend"
	@echo "  make build-backend  - Build only the backend (requires frontend/dist)"
	@echo "  make run            - Run the Go application locally"
	@echo "  make test           - Run Go tests"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make clean-all      - Clean everything including node_modules"

# Build everything (frontend + backend)
build: build-frontend build-backend

# Build frontend
build-frontend:
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && npm install
	cd $(FRONTEND_DIR) && npm run build
	@echo "Frontend build complete"

# Copy frontend dist to backend for embedding
prepare-embed: build-frontend
	@echo "Preparing frontend for embedding..."
	@mkdir -p $(EMBEDDED_FRONTEND)
	@cp -r $(FRONTEND_DIST)/* $(EMBEDDED_FRONTEND)/
	@echo "Frontend copied to $(EMBEDDED_FRONTEND)"

# Build backend (requires frontend to be copied)
build-backend: prepare-embed
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go mod download
	cd $(BACKEND_DIR) && go build -v -o app main.go
	@echo "Backend build complete: $(BACKEND_DIR)/app"

# Run the application locally
run:
	@echo "Starting server..."
	cd $(BACKEND_DIR) && ./app

# Run Go tests
test:
	cd $(BACKEND_DIR) && go test ./...

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -f $(BACKEND_DIR)/app
	rm -rf $(EMBEDDED_FRONTEND)
	@echo "Clean complete"

# Clean everything including node_modules
clean-all: clean
	@echo "Cleaning everything..."
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/dist
	@echo "Full clean complete"
