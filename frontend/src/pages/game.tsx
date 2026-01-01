import { useState, useRef, useEffect } from "react";

import { useParams } from "react-router";

import useWebSocket, { ReadyState } from "react-use-websocket";

import { Chess } from "chess.js";
import {
  Chessboard,
  type PieceDropHandlerArgs,
  type PieceHandlerArgs,
} from "react-chessboard";

import useLocalStorage from "../hooks/useLocalStorage";
import GameOverModal from "../components/game-over-modal";
import { checkGameEnd } from "../utils/chess";

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
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    SOCKET_URL + "/game/" + gameId
  );

  useEffect(() => {
    if (!lastMessage || !lastMessage.data) return;
    const data = JSON.parse(lastMessage.data);

    if (data.type === "signal" && data.message === "start_game") {
      setStartGame(true);
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

      return true;
    } catch {
      return false;
    }
  };

  if(checkGameEnd(chessPosition)) {
    console.log(chessPosition);
    gameOverModalRef.current?.showModal();
  }

  function canDragPiece({ piece }: PieceHandlerArgs) {
    return piece.pieceType[0] === playerColor[0];
  }

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    canDragPiece,
    boardOrientation: playerColor,
    id: `multiplayer-${playerColor}`,
  };

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
        <Chessboard options={chessboardOptions} />
      </div>
      <GameOverModal ref={gameOverModalRef} board={chessPosition}/>
    </div>
  );
};

export default Game;
