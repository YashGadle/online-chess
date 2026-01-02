import { Chess } from "chess.js";

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
 * Converts time control to initial time value for players
 * @param timeControl 15|10, 10|5, 5|3
 * @returns milliseconds
 */
export const getTimeMs = (timeControl: string) => {
  let ms = 5 * 60 * 1000; // default
  switch (timeControl) {
    case "15|10":
      ms = 15 * 60 * 1000;
      break;
    case "10|5":
      ms = 10 * 60 * 1000;
      break;
    case "5|3":
      ms = 5 * 60 * 1000;
      break;
    default:
      console.log(`Unknown time control found, ${timeControl}`);
  }

  return ms;
};

export const gameTurn = (board: string) => {
  const chess = new Chess(board);
  return chess.turn();
}