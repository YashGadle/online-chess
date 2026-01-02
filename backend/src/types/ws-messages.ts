export type TimeT = {
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveAtMs: number;
};

export type WSMessageT =
  | ({
      type: "signal";
      message: "start_game";
    } & TimeT)
  | {
      type: "error";
      message: string;
    }
  | {
      type: "move";
      fromSquare: string;
      toSquare: string;
      board: string; // FEN string
      newWhiteTimeMs?: number; // send to clients
      newBlackTimeMs?: number; // sent to clients
    };
