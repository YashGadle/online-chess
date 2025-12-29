import { useEffect } from "react";

import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import * as apiClient from "../utils/api-client";

const StartGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const { data, isPending } = useQuery({
    queryKey: ["startGame"],
    queryFn: () => apiClient.startGame(gameId || ""),
  });

  useEffect(() => {
    console.log(data);
    if (!data) return;
    if (data.success) navigate(`/play/${gameId}`);
  }, [data]);

  if (isPending) return <div>Redirecting, please wait...</div>;
  if (data && !data.success) return <div>{data.message}</div>;

  return null;
};

export default StartGame;
