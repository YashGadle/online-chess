// Message types between frontend and backend

// Msg types
export type WSMsgType = "signal" | "move" | "start_game";

// Main WSMessage type (based on Go's common.WSMessage)
export type WSMessageT =
  | {
    type: "signal";
    data: SignalPayload; // data is typically parsed further depending on type
  } | {
    type: "start_clock";
    data: StartClockPayload;
  }
  | {
    type: "move";
    data: MovePayload;
  }
  | {
    type: "start_game";
    data: StartGamePayload;
  }
  | {
    type: "explicit_game_over";
    data: ExplicitGameOverPayload;
  }
  | {
    type: "draw_offer";
    data: DrawOfferPayload;
  };

export type ExplicitGameOverPayload = {
  gameOverType: "resignation" | "draw_by_agreement";
  pgn: string;
};

export type DrawOfferPayload = {
  message: string;
};

export type SignalPayload = {
  message: string;
  pgn?: string;
};

export type StartClockPayload = {
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveAtMs: number;
}

// Payload for a move (matching Go's MovePayload)
export type MovePayload = {
  fromSquare: string;
  toSquare: string;
  board: string;
  blackTimeMs: number;
  whiteTimeMs: number;
};

// Payload for starting a game (based on Go's StartGamePayload)
export type StartGamePayload = {
  pgn: string;
  playerColor: "w" | "b";
  whiteTimeMs?: number;
  blackTimeMs?: number;
};
