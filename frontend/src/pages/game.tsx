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

const SOCKET_URL = "ws://localhost:5173/ws";

const Game = () => {
  const { gameId = "" } = useParams();
  const { get } = useLocalStorage();
  //@ts-ignore
  const { color: playerColor, time: timeControl } = get<{
    color: "white" | "black";
    time: string;
  }>(gameId);
  const chessGame = useRef(new Chess()).current;

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

      setChessPosition(chessGame.fen());

      return true;
    } catch {
      return false;
    }
  };

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
    </div>
  );
};

export default Game;
