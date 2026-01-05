import { gameTurn, makeMove } from "../utils/chess";
import redis, { type GameCache } from "../config/upstash-redis";
import { extractGameIdFromUrl } from "../utils/extract-game-id-from-url";

import type { WSMessageT } from "../types/ws-messages";

/**
 * Sends "start_game" signal when both clients join the game with proper clock times
 * @param clients Map of all the connected clients
 * @param users list of users in a game
 */
export const signalStartGame = (
  clients: Map<string, WebSocket>,
  game: GameCache
) => {
  if (clients.has(game.users[0]) && clients.has(game.users[1])) {
    for (const u of game.users) {
      const client = clients.get(u);
      if (!client || client.readyState !== WebSocket.OPEN) continue;
      client.send(
        JSON.stringify({
          type: "signal",
          message: "start_game",
          whiteTimeMs: game.whiteTimeMs,
          blackTimeMs: game.blackTimeMs,
        } satisfies Extract<WSMessageT, { type: "signal" }>)
      );
    }
  }
};

/**
 * Handled chess moves between players.
 * Syncs clock times and validates moves
 * Sends the move to the opponent.
 * @param ws Sender's connection object
 * @param clients List of all WS clients connected to server
 * @param dataJSON Sender JSON message
 * @param request express request object
 * @returns
 */
const handleChessGame = async (
  ws: WebSocket,
  clients: Map<string, WebSocket>,
  dataJSON: WSMessageT,
  request: any
) => {
  if (dataJSON.type !== "move") return;

  const userId: string = request.session.userId;
  const gameId = extractGameIdFromUrl(request.url);
  const game = await redis.get<GameCache>(gameId);

  if (!game) {
    const errorMsg = "Game not found for Id: " + gameId;
    console.log(errorMsg);
    return ws.send(JSON.stringify({ error: true, message: errorMsg }));
  }

  if (!game?.users.some((u) => u === userId)) {
    const errorMsg = "User not part of the Game: " + userId;
    console.log(errorMsg);
    return ws.send(JSON.stringify({ error: true, message: errorMsg }));
  }

  const { board, fromSquare, toSquare } = dataJSON;
  const playerClient = clients.get(userId);
  if (!playerClient) return;

  // Time calculation
  const turn = gameTurn(board),
    elapsed = Date.now() - (game.lastMoveAtMs || 0);
  let newWhiteTimeMs = game.whiteTimeMs,
    newBlackTimeMs = game.blackTimeMs;
  if (turn === "w") {
    newWhiteTimeMs -= elapsed;
  } else {
    newBlackTimeMs -= elapsed;
  }

  const newBoard = makeMove(board, fromSquare, toSquare);
  if (!newBoard)
    return playerClient.send(
      JSON.stringify({
        type: "signal",
        message: "invalid_move",
      })
    );

  const opponent = game?.users.find((u) => u !== userId); // find opponent connection
  if (!opponent) return;

  const oppClient = clients.get(opponent);
  if (oppClient?.readyState === WebSocket.OPEN) {
    // set redis with new time values
    redis.set(gameId, {
      users: game.users,
      gameStart: true,
      whiteTimeMs: newWhiteTimeMs,
      blackTimeMs: newBlackTimeMs,
      lastMoveAtMs: Date.now(),
    });

    oppClient.send(
      JSON.stringify({
        type: "move",
        fromSquare: fromSquare,
        toSquare: toSquare,
        board: newBoard,
        whiteTimeMs: newWhiteTimeMs,
        blackTimeMs: newBlackTimeMs,
      })
    );
  }
};

export default handleChessGame;
