import { useEffect, useRef } from "react";

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
    drawOffer,
    resign,
  } = useGameContext();

  useEffect(() => {
    if (checkGameEnd(chessPosition)) {
      gameOverModalRef.current?.showModal();
    }
  }, [chessPosition])

  if (!gameId) return null;
  return (
    <div className="flex flex-col lg:flex-row gap-6 px-6">
      <section className="flex max-w-full grow-3 flex-col items-center p-4">
        <div className="relative w-full">
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
      </section>

      <section className="flex flex-col gap-2 grow my-8">
        <div className="flex gap-2 items-center justify-center">
          <button
            className="btn btn-primary"
            disabled={readyState !== ReadyState.OPEN || !startGame}
            onClick={resign}>Resign
          </button>
          <button
            className="btn btn-secondary"
            disabled={readyState !== ReadyState.OPEN || !startGame}
            onClick={drawOffer}>Offer Draw
          </button>
        </div>

        <div className="h-full w-2xl bg-base-300">

        </div>
      </section>
    </div>
  );
};

const BlockingOverlay = () => (
  <div className="absolute inset-0 z-10 bg-black/50 flex justify-center items-center rounded-lg">
    <span className="text-3xl text-white">Waiting for opponent</span>
  </div>
);


export default Game;
