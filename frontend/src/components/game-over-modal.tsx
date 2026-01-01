import { type RefObject } from "react";
import { Chess } from "chess.js";

type PropsT = {
  ref: RefObject<HTMLDialogElement | null>;
  board: string;
};

const GameOverModal = (props: PropsT) => {
  const game = new Chess(props.board);
  function getGameResultMessage() {
    if (!game.isGameOver()) {
      return null; // or "Game in progress"
    }

    // Checkmate → there IS a winner
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      return `${winner} wins by checkmate`;
    }

    // Draw cases
    if (game.isStalemate()) {
      return "Draw by stalemate";
    }

    if (game.isThreefoldRepetition()) {
      return "Draw by threefold repetition";
    }

    if (game.isInsufficientMaterial()) {
      return "Draw by insufficient material";
    }

    // Fallback (shouldn’t normally hit)
    return "Draw";
  }

  return (
    <dialog
      id="game-over-modal"
      ref={props.ref}
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box">
        <h3>Game Over</h3>
        <p>{getGameResultMessage()}</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Close</button>
          </form>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default GameOverModal;
