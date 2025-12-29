import { WebSocketServer } from "ws";

import redis from "./upstash-redis.ts";

const wss = new WebSocketServer({
  port: 8080,
});

wss.on("connection", (ws, request) => {
  //@ts-ignore
  const userId = request.session.userId;
  const url = request.url?.split("/");
  let gameId = null;
  if (url) gameId = url[url.length - 1];

  console.log("Client Connected", request.url, userId);

  const data = {
    success: true,
    message: "User is authenticated to play this game",
  };
  ws.send(JSON.stringify(data));

  ws.on("message", (buffer: Buffer) => {
    //TODO chess logic
    const msg = Buffer.from(buffer).toString();
    console.log("message received", msg);

    ws.send("Yes I received your message");
  });

  ws.on("close", () => {
    console.log("User disconnected", userId);
  });

  ws.on("error", (error) => {
    console.log("Error occurred");
  });
});
