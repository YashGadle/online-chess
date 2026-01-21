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
    <div className="absolute inset-0 z-10 bg-black/50 flex justify-center items-center rounded-lg">
      <span className="text-3xl text-white">Waiting for opponent</span>
    </div>
  );

  if (!gameId) return null;
  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4">
      <div className="relative w-full max-w-[min(90vw,90vh,600px)]">
        <div className="flex flex-col gap-2 relative">
          {startGame && (
            // opponent's clock
            <Clock
              timeMs={
                opponentColor === "w"
                  ? clockTimes.whiteTimeMs
                  : clockTimes.blackTimeMs
              }
              isRunning={startClock && activeTurn === opponentColor}
            />
          )}
          <div className="relative w-full aspect-square">
            {(readyState !== ReadyState.OPEN || !startGame) && (
              <BlockingOverlay />
            )}
            <Chessboard options={chessBoardOptions} />
          </div>
          {startGame && (
            // player's clock
            <Clock
              timeMs={
                playerColor === "w"
                  ? clockTimes.whiteTimeMs
                  : clockTimes.blackTimeMs
              }
              isRunning={startClock && activeTurn === playerColor}
            />
          )}
        </div>
      </div>
      <GameOverModal ref={gameOverModalRef} board={chessPosition} />
    </div>
  );
};

export default Game;
