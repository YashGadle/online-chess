import { useEffect, useState, useRef } from "react";

type PropsT = {
  timeMs: number;
  isRunning: boolean;
};

const Clock = ({ timeMs: initialTimeMs, isRunning }: PropsT) => {
  const [timeMs, setTimeMs] = useState(initialTimeMs);
  const clockTimer = useRef<number | undefined>(undefined);

  // Update time when prop changes
  useEffect(() => {
    setTimeMs(initialTimeMs);
  }, [initialTimeMs]);

  // Handle clock running/pausing
  useEffect(() => {
    if (isRunning && timeMs > 0) {
      if (clockTimer.current) return; // Already running
      
      clockTimer.current = setInterval(() => {
        setTimeMs((t) => Math.max(t - 1000, 0));
      }, 1000);
    } else {
      if (clockTimer.current) {
        clearInterval(clockTimer.current);
        clockTimer.current = undefined;
      }
    }

    return () => {
      if (clockTimer.current) {
        clearInterval(clockTimer.current);
        clockTimer.current = undefined;
      }
    };
  }, [isRunning, timeMs]);

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
