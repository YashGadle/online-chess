import { useEffect } from "react";

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

  set(gameId, {});

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
