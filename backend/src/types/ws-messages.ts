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
      move: string;
      board: string; // FEN string
    };
