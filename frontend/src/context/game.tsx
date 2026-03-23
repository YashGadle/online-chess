import { createContext, useContext, useEffect, useState, useRef } from "react";

import { Chess, type Square } from "chess.js";
import { useParams } from "react-router";
import useWebSocket, { type ReadyState } from "react-use-websocket";
import {
  type PieceDropHandlerArgs,
  type PieceHandlerArgs,
  type SquareHandlerArgs,
  type ChessboardOptions,
  defaultPieces,
} from "react-chessboard";

import { useAppContext } from "./app";

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
  drawOffer: () => void,
  resign: () => void,
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
  const appContext = useAppContext();
  const { gameId = "" } = useParams();
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    SOCKET_URL + "/game/" + gameId
  );

  const chessGame = useRef(new Chess()).current;

  const [startGame, setStartGame] = useState(false);
  const [startClock, setStartClock] = useState(false);
  const [clockTimes, setClockTimes] = useState({
    whiteTimeMs: 0,
    blackTimeMs: 0,
  });
  const [squareStyles, setSquareStyles] = useState({});
  const [chessPosition, setChessPosition] = useState(new Chess().fen());
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [activeTurn, setActiveTurn] = useState<"w" | "b">("w");
  //const [explicitGameOver, setExplicitGameOver] = useState({ over: false, message: '' });

  useEffect(() => {
    if (!lastMessage || !lastMessage.data) return;
    const data: WSMessageT = JSON.parse(lastMessage.data);

    if (data.type === "start_game") {
      chessGame.loadPgn(data.data.pgn);
      setStartGame(true);
      setPlayerColor(data.data.playerColor);
      setChessPosition(chessGame.fen());
    } else if (data.type === "start_clock") {
      const lastMoveAtMs = data.data.lastMoveAtMs || 0;
      const whiteTimeMs = data.data.whiteTimeMs || 0;
      const blackTimeMs = data.data.blackTimeMs || 0;
      if (lastMoveAtMs === 0) {
        // First move has been made, so we don't need to deduct time
        setClockTimes({
          whiteTimeMs: whiteTimeMs,
          blackTimeMs: blackTimeMs,
        });
      } else {
        if (activeTurn === "w") {
          setClockTimes({
            whiteTimeMs: whiteTimeMs - (Date.now() - lastMoveAtMs),
            blackTimeMs: blackTimeMs,
          });
        } else {
          setClockTimes({
            whiteTimeMs: whiteTimeMs,
            blackTimeMs: blackTimeMs - (Date.now() - lastMoveAtMs),
          });
        }
      }

      setStartClock(true);
    } else if (data.type === "move") {
      try {
        chessGame.move({ from: data.data.fromSquare, to: data.data.toSquare });
        setChessPosition(chessGame.fen());
        setActiveTurn(chessGame.turn());
        setClockTimes({
          blackTimeMs: data.data.blackTimeMs,
          whiteTimeMs: data.data.whiteTimeMs,
        });
      } catch {
        appContext.showToast({
          type: "error",
          message: "Invalid move",
        });
      }
    } else if (data.type === "signal") {
      const board = data.data.pgn;
      if (!board) return;
      setChessPosition(board);
      chessGame.load(board);

    }
    /**else if (data.type === "explicit_game_over") {
      if (data.data.gameOverType === "resignation") {
        setExplicitGameOver({ over: true, message: data.data.message });
      }
    }**/
  }, [lastMessage]);

  const drawOffer = () => {
    sendJsonMessage({
      type: 'draw'
    })
  }
  const resign = () => {
    sendJsonMessage({
      type: 'resign'
    })
  }

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
    darkSquareStyle: { backgroundColor: "#2E3745" },
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
        // @ts-expect-error: Just ignore this
        chessBoardOptions,
        drawOffer,
        resign,
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
