import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { sessionParser } from "./config/session.ts";
import { setupWebSocket } from "./config/ws.ts";

import Game from "./routes/game.ts";

const app = express();
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: true,
    })
  );
}

const server = http.createServer(app);

app.use(sessionParser);
app.use(express.json());

// route
app.use("/api", Game);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "../frontend", "dist", "index.html"));
  });
}

setupWebSocket(server);
server.listen(5001, () => {
  console.log("Server listening on 5001");
});
