import { WebSocketServer } from "ws";

import type { Server as HttpServer } from "http";

import { sessionParser } from "./session";
import { extractGameIdFromUrl } from "../utils/extract-game-id-from-url";
import redis, { type GameCache } from "./upstash-redis";

import type { WSMessageT } from "../types/ws-messages";
import { signalStartGame } from "../routes/chess";

import handleChessGame from "../routes/chess";

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server });
  const clients = new Map<string, WebSocket>();
  wss.on("connection", async (ws, request: any) => {
    if (!request.url?.startsWith("/ws/game/")) {
      ws.close(1008, "Invalid path");
      return;
    }
    sessionParser(request, {} as any, async () => {
      if (!request.session?.userId) {
        ws.close(1008, "Unauthorized");
        return;
      }

      const userId = request.session.userId;
      //@ts-ignore: Property 'dispatchEvent' is missing in type @types/ws/index
      clients.set(userId, ws);

      const gameId = extractGameIdFromUrl(request.url);
      const game = await redis.get<GameCache>(gameId);
      if (game && game.users.length === 2) {
        signalStartGame(clients, game);
      }

      ws.on("message", async (data: Buffer) => {
        try {
          const dataJSON: WSMessageT = JSON.parse(data.toString());

          // Logic to handle chess moves
          if (dataJSON.type === "move") {
            //@ts-ignore: Property 'dispatchEvent' is missing in type @types/ws/index
            handleChessGame(ws, clients, dataJSON, request);
          }
        } catch (error) {
          console.log("Unable to parse message", error);
        }
      });

      ws.on("close", () => {
        clients.delete(userId);
      });
    });
  });

  return wss;
}
