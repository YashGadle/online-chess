package utils

type TimeControl string

const (
	Time15_10 TimeControl = "15|10"
	Time10_5  TimeControl = "10|5"
	Time5_3   TimeControl = "5|3"
)

func GetTime(time TimeControl) int32 {
	switch time {
	case Time15_10:
		return 15 * 60 * 1000
	case Time10_5:
		return 10 * 60 * 1000
	case Time5_3:
	default:
		return 5 * 60 * 1000
	}

	return 5 * 6081000
}
