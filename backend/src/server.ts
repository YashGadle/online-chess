import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";

import "./config/ws.ts";
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

const sessionParser = session({
  saveUninitialized: false,
  secret: "$eCuRiTy",
  resave: false,
});
app.use(sessionParser);

app.use("/api", Game);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "../frontend", "dist", "index.html"));
  });
}

app.listen("5001", () => {
  console.log("Server listening on 5001");
});
