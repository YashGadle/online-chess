import { WebSocketServer } from "ws";

import type { Server as HttpServer } from "http";

import { sessionParser } from "./session";
import { extractGameIdFromUrl } from "../utils/extract-game-id-from-url";
import redis, { type GameCache } from "./upstash-redis";

import type { WSMessageT } from "../types/ws-messages";
import { signalStartGame } from "../routes/chess";

import handleChessGame from "../routes/chess";

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

  return wss;
}
