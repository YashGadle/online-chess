import { useState, useRef, useEffect } from "react";

import { useParams } from "react-router";

import useWebSocket, { ReadyState } from "react-use-websocket";

import { Chess } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";

const SOCKET_URL = "ws://localhost:5173/ws";

const Game = () => {
  const { gameId } = useParams();
  const chessGame = useRef(new Chess()).current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    SOCKET_URL + "/game/" + gameId
  );

  useEffect(() => {
    console.log(lastMessage, typeof lastMessage);
    if (!lastMessage || !lastMessage.data) return;
    const data = JSON.parse(lastMessage.data);
    if (data && data.type && data.type === "move") {
      chessGame.move(data.move);
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
        move: targetSquare,
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

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    id: "play-vs-random",
  };

  return (
    <div className="flex flex-col justify-center items-center">
      {readyState !== ReadyState.OPEN && (
        <div>Please wait for the players to connect</div>
      )}
      <Chessboard options={chessboardOptions} />
    </div>
  );
};

export default Game;
