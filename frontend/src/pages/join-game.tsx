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

  set(gameId, {
    moves: []
  });

  const { data } = useQuery({
    queryKey: ["startGame"],
    queryFn: () => apiClient.startGame(gameId || "", searchParams.toString()),
  });

  useEffect(() => {
    if (!data) return remove(gameId);
    if (data.ok) {
      setTimeout(() => navigate(`/play/${gameId}`), 2000);
    }
  }, [data]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center h-full">
      {(!data || data.ok) && <PendingState />}
      {data && !data.ok && <ErrorState />}
    </div>
  );
};

const PendingState = () => {
  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-[clamp(1.8rem,6vw+1rem,5rem)] text-center leading-none">
        <i>
          Entering the <span className="inline lg:block text-secondary">Arena</span>
        </i>
      </h1>
      <p className="max-md:mt-4 text-accent-content text-[1.2rem] text-balance text-center">
        Synchronizing with your opponent. The board is being set for a clash of intellects.
      </p>

      <div className="flex gap-4 items-center mt-6 bg-tertiary-100 px-5 py-2 rounded-sm">
        <span className="loading loading-dots loading-xl text-secondary" />
        <span className="text-sm uppercase tracking-widest text-accent-content">Establishing Connection</span>
      </div>
    </div>

  )
}

const ErrorState = () => {
  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-[clamp(1.8rem,6vw+1rem,5rem)] text-center leading-none">
        <i>
          The Arena Remains <span className="inline lg:block text-secondary">Silent</span>
        </i>
      </h1>
      <p className="max-md:mt-4 text-accent-content text-[1.2rem] text-balance text-center">
        The connection to your opponent has been severed. The board is clear, but the challenge remains.
      </p>

      <div className="flex gap-4 items-center mt-6 bg-tertiary-100 px-5 py-2 rounded-sm">
        <span className="w-3.5 h-3.5 rounded-full bg-error" />
        <span className="text-sm uppercase tracking-widest text-accent-content">Failed to connect</span>
      </div>
    </div>

  )
}

export default JoinGame;
