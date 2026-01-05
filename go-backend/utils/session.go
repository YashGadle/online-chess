package utils

import (
	"net/http"
	"time"

	"github.com/google/uuid"
)

func SetGuestSession(w http.ResponseWriter, r *http.Request) string {
	cookie, err := r.Cookie("guest_id")
	if err == nil {
		return cookie.Value
	}

	userId := uuid.NewString()
	http.SetCookie(w, &http.Cookie{
		Name:     "guest_id",
		Value:    userId,
		Path:     "/",
		MaxAge:   int((24 * time.Hour).Seconds()), // 1 day
		HttpOnly: true,
		Secure:   true, // true in prod
		SameSite: http.SameSiteLaxMode,
	})

	return userId
}

func GetGuestSession(r *http.Request) (string, error) {
	cookie, err := r.Cookie("guest_id")
	if err != nil {
		if err == http.ErrNoCookie {
			// Cookie doesn't exist
			return "", nil
		}
		// Some other error
		return "", err
	}

	return cookie.Value, nil
}
