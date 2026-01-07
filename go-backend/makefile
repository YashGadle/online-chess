# Binary name
APP_NAME := online-chess-go

# Go parameters
GO := go
GOFLAGS := -v
BUILD_DIR := bin

.PHONY: all build run test clean

all: build

build:
	$(GO) build $(GOFLAGS) -o $(BUILD_DIR)/$(APP_NAME)

run:
	$(GO) run main.go

test:
	$(GO) test ./...

clean:
	rm -rf $(BUILD_DIR)