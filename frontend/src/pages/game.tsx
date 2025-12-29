import { useParams } from "react-router";

const Game = () => {
  const { gameId } = useParams();
  return (
    <div className="flex flex-col justify-center items-center">
      <div>User Connected: {gameId}</div>
    </div>
  );
};

export default Game;
