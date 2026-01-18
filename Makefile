# ======================
# Project variables
# ======================
APP_NAME := online-chess-go

FRONTEND_DIR := frontend
BACKEND_DIR := go-backend

FRONTEND_DIST := $(FRONTEND_DIR)/dist
EMBEDDED_FRONTEND := $(BACKEND_DIR)/frontend/dist

BACKEND_BIN := $(BACKEND_DIR)/app
BACKEND_SRCS := $(shell find $(BACKEND_DIR) -name '*.go')

# Marker files (what make actually tracks)
FRONTEND_MARKER := $(FRONTEND_DIST)/.built
EMBED_MARKER := $(EMBEDDED_FRONTEND)/.copied

# Frontend inputs
FRONTEND_SRCS := $(shell find $(FRONTEND_DIR)/src -type f)
FRONTEND_DEPS := $(FRONTEND_DIR)/package.json $(FRONTEND_DIR)/package-lock.json

.PHONY: all build build-frontend build-backend run test clean clean-all help

# ======================
# Default target
# ======================
all: build

help:
	@echo "Available targets:"
	@echo "  make build          - Build frontend and backend (incremental)"
	@echo "  make build-frontend - Build only the frontend"
	@echo "  make build-backend  - Build only the backend"
	@echo "  make run            - Run the Go application locally"
	@echo "  make test           - Run Go tests"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make clean-all      - Clean everything including node_modules"

# ======================
# High-level aliases
# ======================
build: $(BACKEND_BIN)

build-frontend: $(FRONTEND_MARKER)

build-backend: $(BACKEND_BIN)

# ======================
# Frontend build
# ======================
$(FRONTEND_MARKER): $(FRONTEND_SRCS) $(FRONTEND_DEPS)
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && npm ci
	cd $(FRONTEND_DIR) && npm run build
	touch $(FRONTEND_MARKER)
	@echo "Frontend build complete"

# ======================
# Embed frontend into backend
# ======================
$(EMBED_MARKER): $(FRONTEND_MARKER)
	@echo "Embedding frontend into backend..."
	mkdir -p $(EMBEDDED_FRONTEND)
	rm -rf $(EMBEDDED_FRONTEND)/*
	cp -r $(FRONTEND_DIST)/* $(EMBEDDED_FRONTEND)/
	touch $(EMBED_MARKER)
	@echo "Frontend embedded"

# ======================
# Backend build
# ======================
$(BACKEND_BIN): $(EMBED_MARKER) $(BACKEND_SRCS) $(BACKEND_DIR)/go.mod $(BACKEND_DIR)/go.sum
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go mod download
	cd $(BACKEND_DIR) && go build -v -o app main.go
	@echo "Backend build complete: $(BACKEND_BIN)"

# ======================
# Run / Test
# ======================
run:
	@echo "Starting server..."
	cd $(BACKEND_DIR) && ./app

test:
	cd $(BACKEND_DIR) && go test ./...

# ======================
# Clean
# ======================
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(BACKEND_BIN)
	rm -rf $(EMBEDDED_FRONTEND)
	rm -f $(FRONTEND_MARKER) $(EMBED_MARKER)
	@echo "Clean complete"

clean-all: clean
	@echo "Cleaning everything..."
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIST)
	@echo "Full clean complete"
