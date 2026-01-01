import { Chess } from "chess.js";

/**
 * Sends "start_game" signal when both clients join the game.
 * @param clients Map of all the connected clients
 * @param users list of users in a game
 */
export const signalStartGame = (
  clients: Map<string, WebSocket>,
  users: string[]
) => {
  if (clients.has(users[0]) && clients.has(users[1])) {
    for (const u of users) {
      const client = clients.get(u);
      if (!client || client.readyState !== WebSocket.OPEN) continue;
      client.send(
        JSON.stringify({
          type: "signal",
          message: "start_game",
        })
      );
    }
  }
};

/**
 * Makes a move on the board.
 * @param board FEN string used to initialize board
 * @param fromSquare string move from
 * @param toSquare string move to
 * @returns New FEN after making the move
 */
export const makeMove = (
  board: string,
  fromSquare: string,
  toSquare: string
) => {
  try {
    const chess = new Chess(board);
    const move = chess.move({
      from: fromSquare,
      to: toSquare,
      promotion: "q",
    });

    if (!move) {
      console.log("Invalid move");
      return null;
    }

    return chess.fen();
  } catch (err) {
    console.log("Make move error", err);
  }
};

/**
 * Checks how to game ends
 * @param board FEN string used to initialize board
 * @returns isGameOver, isStaleMate, isDraw
 */
export const checkGameEnd = (board: string) => {
  const chess = new Chess(board);
  const isGameOver = chess.isGameOver();
  const isStaleMate = chess.isStalemate();
  const isDraw = chess.isDraw();

  return {
    isGameOver,
    isStaleMate,
    isDraw,
  };
};
