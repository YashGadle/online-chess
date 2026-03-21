// Package utils Chess time control util
package utils

type TimeControl string

const (
	Time10_5 TimeControl = "10|5"
	Time5_2  TimeControl = "5|2"
	Time3_1  TimeControl = "3|1"
	Time1_0  TimeControl = "1|0"
)

func GetTime(time TimeControl) int64 {
	switch time {
	case Time10_5:
		return 10 * 60 * 1000
	case Time5_2:
		return 5 * 60 * 1000
	case Time3_1:
		return 3 * 60 * 1000
	case Time1_0:
		return 1 * 60 * 1000
	default:
		return 5 * 60 * 1000
	}

	return 5 * 6081000
}
