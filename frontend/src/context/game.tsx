import { createContext, useContext, useEffect, useState, useRef } from "react";

import { Chess, type Square } from "chess.js";
import { useParams } from "react-router";
import useWebSocket, { type ReadyState } from "react-use-websocket";
import type {
  PieceDropHandlerArgs,
  PieceHandlerArgs,
  SquareHandlerArgs,
  ChessboardOptions,
} from "react-chessboard";

import useLocalStorage from "../hooks/useLocalStorage";

import type { WSMessageT } from "../types/web-socket";

export type GameContextT = {
  gameId: string;
  readyState: ReadyState;
  startGame: boolean;
  activeTurn: "w" | "b";
  playerColor: "w" | "b";
  opponentColor: "w" | "b";
  startClock: boolean;
  clockTimes: { whiteTimeMs: number; blackTimeMs: number };
  chessPosition: string;
  chessBoardOptions: ChessboardOptions;
};

const SOCKET_URL =
  import.meta.env.MODE === "development"
    ? `ws://localhost:5001/ws`
    : `wss://${window.location.host}/ws`;
const GameContext = createContext<GameContextT | undefined>(undefined);

export const GameContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { get: getGame } = useLocalStorage();
  const { gameId = "" } = useParams();
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    SOCKET_URL + "/game/" + gameId
  );

  const {
    //@ts-ignore
    color: playerColor,
    //@ts-ignore
    time: timeControl,
    //@ts-ignore
    gameFen = new Chess().fen(),
  } = getGame<{
    color: "w" | "b";
    time: string;
    gameFen: string;
  }>(gameId);
  const chessGame = useRef(new Chess(gameFen)).current;

  const [startGame, setStartGame] = useState(false);
  const [startClock] = useState(false);
  const [clockTimes] = useState({
    whiteTimeMs: 0,
    blackTimeMs: 0,
  });
  const [squareStyles, setSquareStyles] = useState({});
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [activeTurn, setActiveTurn] = useState(chessGame.turn());

  useEffect(() => {
    // WS handlers
    if (!lastMessage || !lastMessage.data) return;
    const data: WSMessageT = JSON.parse(lastMessage.data);

    if (data.type === "start_game") {
      // both players connected
      setStartGame(true);
      setChessPosition(data.data.board);

      // TODO
      // setClockTimes({
      //   whiteTimeMs: data.whiteTimeMs,
      //   blackTimeMs: data.blackTimeMs,
      // });
      // setStartClock(true);
    }
    if (data.type === "move") {
      chessGame.move({ from: data.data.fromSquare, to: data.data.toSquare });
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
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      sendJsonMessage({
        type: "move",
        data: {
          fromSquare: sourceSquare,
          toSquare: targetSquare,
          board: chessGame.fen(),
          clientMoveTimeMs: Date.now(),
        },
      } as WSMessageT);

      setActiveTurn(chessGame.turn());
      setChessPosition(chessGame.fen());
      setSquareStyles({});

      return true;
    } catch {
      return false;
    }
  };

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
    return piece.pieceType[0] === playerColor;
  }

  const chessBoardOptions = {
    id: `multiplayer-${playerColor}`,
    position: chessPosition,
    boardOrientation: playerColor === "w" ? "white" : "black",
    squareStyles,
    onPieceDrop,
    canDragPiece,
    onSquareClick: ({ piece, square }: SquareHandlerArgs) => {
      if (!piece) return setSquareStyles({});
      highlightMoves(square);
    },
  };

  return (
    <GameContext.Provider
      value={{
        gameId,
        readyState,
        startGame,
        activeTurn,
        playerColor,
        opponentColor: playerColor === "w" ? "b" : "w",
        startClock,
        clockTimes,
        chessPosition,
        //@ts-ignore
        chessBoardOptions,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  return context as GameContextT;
};
