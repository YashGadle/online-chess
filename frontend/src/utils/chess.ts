import { Chess } from "chess.js";

/**
 * Checks how to game ends
 * @param board FEN string used to initialize board
 * @returns isGameOver, isStaleMate, isDraw
 */
export const checkGameEnd = (board: string) => {
  const chess = new Chess(board);
  return (
    chess.isGameOver() ||
    chess.isStalemate() ||
    chess.isDraw() ||
    chess.isThreefoldRepetition() ||
    chess.isInsufficientMaterial()
  );
};
