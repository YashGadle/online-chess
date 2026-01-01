export type WSMessageT =
  | {
      type: "signal";
      message: "start_game";
    }
  | {
      type: "error";
      message: string;
    }
  | {
      type: "move";
      fromSquare: string;
      toSquare: string;
      board: string; // FEN string
    };
