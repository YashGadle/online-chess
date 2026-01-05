import { useEffect } from "react";

import { Chess } from "chess.js";

import { useLocation, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import * as apiClient from "../utils/api-client";
import useLocalStorage from "../hooks/useLocalStorage";

const JoinGame = () => {
  const { set, remove } = useLocalStorage();

  const navigate = useNavigate();
  const { gameId = "" } = useParams();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);

  const playerColor = searchParams.get("color");
  const gameTimeControl = searchParams.get("time");

  set(gameId, {
    color: playerColor,
    time: gameTimeControl,
    gameFen: new Chess().fen(),
  });

  const { data, isPending } = useQuery({
    queryKey: ["startGame"],
    queryFn: () => apiClient.startGame(gameId || "", searchParams.toString()),
  });

  useEffect(() => {
    if (!data) return remove(gameId);
    if (data.ok) navigate(`/play/${gameId}`);
  }, [data]);

  if (isPending) return <div>Redirecting, please wait...</div>;
  if (data && !data.ok) return <div>Error </div>;

  return null;
};

export default JoinGame;
