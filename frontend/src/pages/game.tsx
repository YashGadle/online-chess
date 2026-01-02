import { useState, useRef, useEffect } from "react";

import { useParams } from "react-router";

import useWebSocket, { ReadyState } from "react-use-websocket";

import { Chess, type Square } from "chess.js";
import {
  Chessboard,
  type PieceDropHandlerArgs,
  type PieceHandlerArgs,
  type SquareHandlerArgs,
} from "react-chessboard";

import useLocalStorage from "../hooks/useLocalStorage";
import GameOverModal from "../components/game-over-modal";
import Clock from "../components/clock";

import { checkGameEnd } from "../utils/chess";

import type { WSMessageT } from "../../../backend/src/types/ws-messages";

const SOCKET_URL = "ws://localhost:5173/ws";

const Game = () => {
  const gameOverModalRef = useRef<HTMLDialogElement>(null);
  const { gameId = "" } = useParams();
  const { get: getGame, set: setGame } = useLocalStorage();
  const {
    color: playerColor,
    time: timeControl,
    gameFen = new Chess().fen(),
  } = getGame<{
    color: "white" | "black";
    time: string;
    gameFen: string;
  }>(gameId);
  const chessGame = useRef(new Chess(gameFen)).current;

  const [startGame, setStartGame] = useState(false);
  const [clockTimes, setClockTimes] = useState({
    whiteTimeMs: 0,
    blackTimeMs: 0,
  });
  const [squareStyles, setSquareStyles] = useState({});
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    SOCKET_URL + "/game/" + gameId
  );

  useEffect(() => {
    if (!lastMessage || !lastMessage.data) return;
    const data = JSON.parse(lastMessage.data) as WSMessageT;

    if (data.type === "signal" && data.message === "start_game") {
      setStartGame(true);
      setClockTimes({
        whiteTimeMs: data.whiteTimeMs,
        blackTimeMs: data.blackTimeMs,
      });
    }

    if (data && data.type && data.type === "move") {
      chessGame.move({ from: data.fromSquare, to: data.toSquare });
      setChessPosition(chessGame.fen());
      setGame(gameId, {
        color: playerColor,
        time: timeControl,
        gameFen: chessGame.fen(),
      });
    }
  }, [lastMessage]);

  const onPieceDrop = ({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) => {
    if (!targetSquare) {
      return false;
    }

    try {
      sendJsonMessage({
        type: "move",
        fromSquare: sourceSquare,
        toSquare: targetSquare,
        board: chessGame.fen(),
        clientMoveTimeMs: Date.now(),
      });

      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setGame(gameId, {
        color: playerColor,
        time: timeControl,
        gameFen: chessGame.fen(),
      });

      setChessPosition(chessGame.fen());
      setSquareStyles({});

      return true;
    } catch {
      return false;
    }
  };

  if (checkGameEnd(chessPosition)) {
    gameOverModalRef.current?.showModal();
  }

  function highlightMoves(square: string | null) {
    if (!square) return setSquareStyles({});
    const fromSquare = square.toLowerCase() as Square;

    const moves = chessGame.moves({
      square: fromSquare,
      verbose: true,
    });

    if (!moves.length) {
      setSquareStyles({});
      return;
    }

    const styles: Record<string, React.CSSProperties> = {
      [fromSquare]: { background: "rgba(255, 255, 0, 0.4)" },
    };

    moves.forEach((move) => {
      styles[move.to] = {
        background: move.captured
          ? "radial-gradient(circle, rgba(255,0,0,.45) 85%, transparent 85%)"
          : "radial-gradient(circle, rgba(0,0,0,.3) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });

    setSquareStyles(styles);
  }

  function canDragPiece({ piece }: PieceHandlerArgs) {
    return piece.pieceType[0] === playerColor[0];
  }

  const BlockingOverlay = () => (
    <div className="h-full w-full absolute z-2 bg-black/50 flex justify-center items-center">
      <span className="text-3xl">Waiting for opponent</span>
    </div>
  );

  const chessboardOptions = {
    id: `multiplayer-${playerColor}`,
    position: chessPosition,
    boardOrientation: playerColor,
    squareStyles,
    showAnimations: true,
    onPieceDrop,
    canDragPiece,
    onSquareClick: ({ piece, square }: SquareHandlerArgs) => {
      if (!piece) return setSquareStyles({});
      highlightMoves(square);
    },
  };
  console.log(clockTimes)
  if (!gameId) return null;
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="h-[50%] w-[50%] relative">
        {(readyState !== ReadyState.OPEN || !startGame) && <BlockingOverlay />}
        <div>
          <Clock
            timeMs={
              playerColor === "w"
                ? clockTimes.blackTimeMs
                : clockTimes.whiteTimeMs
            }
          />
          <Chessboard options={chessboardOptions} />
          <Clock
            timeMs={
              playerColor === "w"
                ? clockTimes.whiteTimeMs
                : clockTimes.blackTimeMs
            }
          />
        </div>
      </div>
      <GameOverModal ref={gameOverModalRef} board={chessPosition} />
    </div>
  );
};

export default Game;
