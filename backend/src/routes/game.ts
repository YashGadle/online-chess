import { Router, type Request } from "express";
import { v4 as uuidV4 } from "uuid";

import redis from "../config/upstash-redis.ts";

interface GameParams {
  gameId: string;
}

const router = Router();

router.get("/createGame", (_, res) => {
  try {
    const gameId = uuidV4();
    redis.set(gameId, { users: [] });

    res.status(200).json({ gameUrl: `/startGame/${gameId}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/startGame/:gameId", async (req: Request<GameParams>, res) => {
  try {
    const { gameId } = req.params;
    const val = await redis.get<{ users: string[] }>(gameId);

    if (!val)
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });

    if (val.users.length === 2)
      return res.status(400).json({
        success: false,
        message:
          "2 players already joined the game. No more than 2 players can join single game",
      });

    // add a new user to gameId
    const userId = uuidV4();
    val.users.push(userId);
    redis.set(gameId, { users: val.users });

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
