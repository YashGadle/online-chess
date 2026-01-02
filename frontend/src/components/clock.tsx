import { useRef } from "react";

type PropsT = {
  timeMs: number;
};

const Clock = (props: PropsT) => {
  const timeRef = useRef(props.timeMs);
  console.log(timeRef.current);
  return <div>{timeRef.current}</div>;
};

export default Clock;
