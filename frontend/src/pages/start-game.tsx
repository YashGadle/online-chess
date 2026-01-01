import { useEffect } from "react";

import { useLocation, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import * as apiClient from "../utils/api-client";
import { useLocalStorage } from "../hooks/useLocalStorage";

const StartGame = () => {
  const { set, remove } = useLocalStorage();

  const navigate = useNavigate();
  const { gameId = "" } = useParams();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);

  const playerColor = searchParams.get("color");
  const gameTimeControl = searchParams.get("time");

  set(gameId, JSON.stringify({ color: playerColor, time: gameTimeControl }));

  const { data, isPending } = useQuery({
    queryKey: ["startGame"],
    queryFn: () => apiClient.startGame(gameId || ""),
  });

  useEffect(() => {
    if (!data) return remove(gameId);
    if (data.success) navigate(`/play/${gameId}`);
  }, [data]);

  if (isPending) return <div>Redirecting, please wait...</div>;
  if (data && !data.success) return <div>{data.message}</div>;

  return null;
};

export default StartGame;
