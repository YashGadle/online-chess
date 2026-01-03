import { useRef } from "react";

import { Chessboard } from "react-chessboard";
import { ReadyState } from "react-use-websocket";

import GameOverModal from "../components/game-over-modal";
import Clock from "../components/clock";

import { useGameContext } from "../context/game";
import { checkGameEnd } from "../utils/chess";

const Game = () => {
  const gameOverModalRef = useRef<HTMLDialogElement>(null);
  const {
    gameId,
    readyState,
    startGame,
    activeTurn,
    playerColor,
    opponentColor,
    startClock,
    clockTimes,
    chessBoardOptions,
    chessPosition,
  } = useGameContext();

  if (checkGameEnd(chessPosition)) {
    gameOverModalRef.current?.showModal();
  }

  const BlockingOverlay = () => (
    <div className="h-full w-full absolute z-2 bg-black/50 flex justify-center items-center">
      <span className="text-3xl">Waiting for opponent</span>
    </div>
  );

  if (!gameId) return null;
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="h-[50%] w-[50%] relative">
        {(readyState !== ReadyState.OPEN || !startGame) && <BlockingOverlay />}
        <div>
          {startGame && (
            // opponent's clock
            <Clock
              paused={activeTurn !== opponentColor && startClock}
              timeMs={
                opponentColor === "w"
                  ? clockTimes.whiteTimeMs
                  : clockTimes.blackTimeMs
              }
            />
          )}
          <Chessboard options={chessBoardOptions} />
          {startGame && (
            // player's clock
            <Clock
              paused={activeTurn !== playerColor && startClock}
              timeMs={
                playerColor === "w"
                  ? clockTimes.whiteTimeMs
                  : clockTimes.blackTimeMs
              }
            />
          )}
        </div>
      </div>
      <GameOverModal ref={gameOverModalRef} board={chessPosition} />
    </div>
  );
};

export default Game;
