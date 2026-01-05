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
	WhiteTimeMs  int32  `json:"whiteTimeMs"`
	BlackTimeMs  int32  `json:"blackTimeMs"`
	LastMoveAtMs int32  `json:"lastMoveAtMs"`
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

func SetVal(client *redis.Client, ctx context.Context, key string, val RedisCache, exp *time.Duration) error {
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
func GetVal(client *redis.Client, ctx context.Context, key string) (*RedisCache, error) {
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
