import { useEffect, useState } from "react";

type PropsT = {
  timeMs: number;
  paused: boolean;
};

const Clock = (props: PropsT) => {
  const [timeMs, setTimeMs] = useState(props.timeMs);

  useEffect(() => {
    if (props.paused || timeMs <= 0) return;

    const interval = setInterval(() => {
      setTimeMs((t) => Math.max(t - 1000, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [props.paused, timeMs]);

  const totalSeconds = timeMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((timeMs % 1000) / 100);

  return (
    <div>
      {minutes}:{seconds.toString().padStart(2, "0")}
      {totalSeconds < 10 && `.${milliseconds}`}
    </div>
  );
};

export default Clock;
