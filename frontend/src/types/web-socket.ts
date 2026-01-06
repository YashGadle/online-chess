// Message types between frontend and backend

// Msg types
export type WSMsgType = "signal" | "move" | "start_game";

// Main WSMessage type (based on Go's common.WSMessage)
export type WSMessageT =
  | {
      type: "signal";
      data: SignalPayload; // data is typically parsed further depending on type
    }
  | {
      type: "move";
      data: MovePayload;
    }
  | {
      type: "start_game";
      data: StartGamePayload;
    };

export type SignalPayload = {
  message: string;
};

// Payload for a move (matching Go's MovePayload)
export type MovePayload = {
  fromSquare: string;
  toSquare: string;
  board: string;
  clientMoveTimeMs?: number;
};

// Payload for starting a game (based on Go's StartGamePayload)
export type StartGamePayload = {
  board: string;
  whiteTimeMs?: number;
  blackTimeMs?: number;
};
