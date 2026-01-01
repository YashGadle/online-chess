import { Router, type Request } from "express";
import { v4 as uuidV4 } from "uuid";

import redis from "../config/upstash-redis.ts";

interface GameParams {
  gameId: string;
}

const router = Router();

router.post("/createGame", (req, res) => {
  try {
    const gameId = uuidV4();
    const { color = "white", time = "5|3" } = req.body;
    redis.set(gameId, { users: [] });
    let opponentColor = color === "white" ? "black" : "white";

    res.status(200).json({
      gameUrl: `/startGame/${gameId}?color=${color}&time=${time}`,
      inviteUrl: `/startGame/${gameId}?color=${opponentColor}&time=${time}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/startGame/:gameId", async (req: Request<GameParams>, res) => {
  try {
    const { gameId } = req.params;
    const game = await redis.get<{ users: string[] }>(gameId);

    if (!game)
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });

    if (game.users.length === 2)
      return res.status(400).json({
        success: false,
        message:
          "2 players already joined the game. No more than 2 players can join single game",
      });

    //@ts-ignore
    let userId = req.session.userId;
    if (!userId) {
      userId = uuidV4();
    }

    if (game.users.length === 0 || game.users.some((u) => u !== userId)) {
      game.users.push(userId);
      redis.set(gameId, { users: game.users });
    }

    // add user id to session cookie
    //@ts-ignore
    req.session.userId = userId;
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
