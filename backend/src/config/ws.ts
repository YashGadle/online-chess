import { WebSocketServer } from "ws";

import type { Server as HttpServer } from "http";

import { sessionParser } from "./session.ts";
import { extractGameIdFromUrl } from "../utils/extract-game-id-from-url.ts";
import redis, { type GameCache } from "./upstash-redis.ts";

import type { WSMessageT } from "../types/ws-messages.ts";
import { makeMove, signalStartGame } from "../utils/chess.ts";

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (!request.url?.startsWith("/ws")) {
      socket.destroy();
      return;
    }

    sessionParser(request as any, {} as any, () => {
      //@ts-ignore: Property 'session' does not exist on type 'IncomingMessage'.
      if (!request.session?.userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        return socket.destroy();
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  });

  const clients = new Map<string, WebSocket>();

  wss.on("connection", async (ws, request: any) => {
    const userId = request.session.userId;
    //@ts-ignore: Property 'dispatchEvent' is missing in type @types/ws/index
    clients.set(userId, ws);

    const gameId = extractGameIdFromUrl(request.url);
    const game = await redis.get<GameCache>(gameId);
    if (game && game.users.length === 2) {
      signalStartGame(clients, game.users);
    }

    ws.on("message", async (data: Buffer) => {
      try {
        const dataJSON: WSMessageT = JSON.parse(data.toString());
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

        if (dataJSON.type === "move") {
          const { board, fromSquare, toSquare } = dataJSON;
          const player = clients.get(userId);

          if (!player) return;

          const newBoard = makeMove(board, fromSquare, toSquare);
          if (!newBoard)
            return player.send(
              JSON.stringify({
                type: "signal",
                message: "invalid_move",
              })
            );

          const opponent = game.users.find((u) => u !== userId); // find opponent connection
          if (!opponent) return;

          const oppClient = clients.get(opponent);
          if (oppClient?.readyState === WebSocket.OPEN)
            oppClient.send(
              JSON.stringify({
                type: "move",
                fromSquare: fromSquare,
                toSquare: toSquare,
                board: newBoard,
              })
            );
        }
      } catch (error) {
        console.log("Unable to parse message", error);
      }
    });

    ws.on("close", () => {
      clients.delete(userId);
    });
  });

  return wss;
}
