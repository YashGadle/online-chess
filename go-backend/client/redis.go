package client

import (
	"context"
	"encoding/json"
	"os"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

var (
	Ctx     = context.Background()
	rdb     *redis.Client
	once    sync.Once
	initErr error
)

type User struct {
	Id    string `json:"id"`
	Color string `json:"color"`
}
type RedisCache struct {
	Users        []User `json:"users"`
	Board        string `json:"board"`
	GameEnd      bool   `json:"gameEnd"`
	WhiteTimeMs  int64  `json:"whiteTimeMs"`
	BlackTimeMs  int64  `json:"blackTimeMs"`
	LastMoveAtMs int64  `json:"lastMoveAtMs"`
}

// UpdateOptions allows updating specific fields in RedisCache
// Use pointers to indicate which fields should be updated (nil = don't update)
// For bool fields, use a pointer to distinguish between "not set" and "set to false"
type UpdateOptions struct {
	Users        *[]User
	Board        *string
	GameEnd      *bool
	WhiteTimeMs  *int64
	BlackTimeMs  *int64
	LastMoveAtMs *int64
}

func Redis() (*redis.Client, error) {
	once.Do(func() {
		opt, err := redis.ParseURL(os.Getenv("REDIS_URL"))
		if err != nil {
			initErr = err
			return
		}
		rdb = redis.NewClient(opt)

		if err := rdb.Ping(Ctx).Err(); err != nil {
			initErr = err
		}
	})

	return rdb, initErr
}

// setVal is a private function used internally to write RedisCache to Redis
func setVal(ctx context.Context, key string, val RedisCache, exp *time.Duration) error {
	client, err := Redis()
	if err != nil {
		return err
	}

	data, err := json.Marshal(val)
	if err != nil {
		return err
	}

	var cmd *redis.StatusCmd
	if exp == nil {
		cmd = client.SetArgs(ctx, key, data, redis.SetArgs{KeepTTL: true})
	} else {
		cmd = client.Set(ctx, key, data, *exp)
	}

	return cmd.Err()
}
func GetVal(ctx context.Context, key string) (*RedisCache, error) {
	client, err := Redis()
	if err != nil {
		return nil, err
	}

	data, err := client.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var gameCache RedisCache
	if err := json.Unmarshal([]byte(data), &gameCache); err != nil {
		return nil, err
	}
	return &gameCache, nil
}

// CreateGame creates a new game in Redis with the specified values.
// exp can be nil for no expiration, or set to specify expiration.
func CreateGame(ctx context.Context, key string, cache RedisCache, exp *time.Duration) error {
	return setVal(ctx, key, cache, exp)
}

// UpdateVal updates only the specified fields in Redis without affecting other fields.
// Pass an UpdateOptions struct with pointers to the fields you want to update.
// Nil pointers mean "don't update this field".
// Returns an error if the key doesn't exist - use CreateGame to create new games.
// exp can be nil to keep existing TTL.
func UpdateVal(ctx context.Context, key string, updates UpdateOptions, exp *time.Duration) error {
	// Get current value - must exist
	current, err := GetVal(ctx, key)
	if err != nil {
		return err
	}

	// Merge updates into current value
	if updates.Users != nil {
		current.Users = *updates.Users
	}
	if updates.Board != nil {
		current.Board = *updates.Board
	}
	if updates.GameEnd != nil {
		current.GameEnd = *updates.GameEnd
	}
	if updates.WhiteTimeMs != nil {
		current.WhiteTimeMs = *updates.WhiteTimeMs
	}
	if updates.BlackTimeMs != nil {
		current.BlackTimeMs = *updates.BlackTimeMs
	}
	if updates.LastMoveAtMs != nil {
		current.LastMoveAtMs = *updates.LastMoveAtMs
	}

	// Write back the merged value
	return setVal(ctx, key, *current, exp)
}

// PubSub functions for cross-instance communication
func PublishGameEvent(ctx context.Context, gameId string, event []byte) error {
	client, err := Redis()
	if err != nil {
		return err
	}
	channel := "game:" + gameId
	return client.Publish(ctx, channel, event).Err()
}

func SubscribeToGame(ctx context.Context, gameId string) (*redis.PubSub, error) {
	client, err := Redis()
	if err != nil {
		return nil, err
	}
	channel := "game:" + gameId
	pubsub := client.Subscribe(ctx, channel)
	return pubsub, nil
}
