import { useState } from 'react';

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from 'react-router';

import { Tile } from "../components/tile";

import QueenWhite from '../assets/QueenWhite';
import QueenBlack from '../assets/QueenBlack';
import * as apiClient from "../utils/api-client";

import { timeControlOptions } from "../utils/time-control";
import { useAppContext } from '../context/app';

import './game-setup.css';

const WHITE = 'w', BLACK = 'b', RANDOM = '?';

const GameSetup = () => {
  const [timeControl, setTimeControl] = useState("3|1");
  const [color, setColor] = useState<"w" | "b" | "?">(RANDOM);
  const navigate = useNavigate();

  const onTimeControlClick = (tC: string) => {
    setTimeControl(tC);
  }
  const onColorPick = (option: "w" | "b" | "?") => {
    setColor(option);
  }

  const { showToast } = useAppContext();

  const { mutate, isPending } = useMutation({
    mutationKey: ["createGame"],
    mutationFn: apiClient.createGame,
    onSuccess: (data) => {
      if (!data) return;

      showToast({
        type: "success",
        message: "Game created!",
      });

      const queryParams = new URLSearchParams();
      queryParams.set('inviteUrl', btoa(data.inviteUrl));
      navigate(`/waiting-room?${queryParams.toString()}`, { viewTransition: true });

    },
    onError: () => {
      showToast({
        type: "error",
        message: "Couldn't create game. Please try again.",
      });
    },
  });

  const createGameHandler = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (color === RANDOM) {
      const rand = Math.random();
      if (rand > 0.5)
        mutate({ color: WHITE, time: timeControl });
      else mutate({ color: BLACK, time: timeControl });
    } else {
      mutate({ color, time: timeControl });
    }
  };

  return (
    <div className="mx-auto mt-0 lg:mt-14">
      <section className="flex flex-col items-center">
        <p className="tracking-[0.5em] text-[0.8rem] uppercase text-secondary">
          Match Configuration
        </p>
        <h1 className="text-[clamp(1.8rem,6vw+1rem,5rem)]">
          <i>Set the Stage</i>
        </h1>
        <hr className="w-20 text-secondary" />
      </section>

      <section className="flex flex-col mt-14">
        <div className="flex justify-between">
          <span className="text-[1.5rem] text-accent-content"><i>Time Control</i></span>
          <span className="uppercase tracking-wide text-[0.8rem] text-info-content">Minutes per side</span>
        </div>
        <hr className="w-full text-gray-700" />
        <div className="grid grid-cols-2 gap-4 mt-6 lg:grid-cols-4">
          {timeControlOptions.map((time, idx) => (
            <Tile
              key={idx}
              title={time.title}
              subtitle={time.description}
              value={time.value}
              active={time.value === timeControl}
              onClick={onTimeControlClick}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col mt-14">
        <div>
          <span className="text-[1.5rem] text-accent-content"><i>Pick Color</i></span>
          <hr className="w-full text-gray-700" />
        </div>

        <div className="flex justify-center w-full mt-6">
          <div className="relative w-max flex justify-center overflow-hidden rounded-xl">
            <div className="bubble" >
              <div className="bubble-content bg-tertiary-100" />
            </div>
            <button className={`anchor bg-base-300 ${color === WHITE && "active"}`} onClick={() => onColorPick(WHITE)}>
              <div className="flex flex-col items-center justify-center z-2">
                <QueenWhite size={48} />
                White
              </div>
            </button>
            <button className={`anchor bg-base-300 ${color === RANDOM && "active"}`} onClick={() => onColorPick(RANDOM)}>
              <div className="z-2 text-center">
                <div className={`question-mark text-5xl ${color === RANDOM && "active"}`}>?</div>
                Random
              </div>
            </button>
            <button className={`anchor bg-base-300 ${color === BLACK && "active"}`} onClick={() => onColorPick(BLACK)}>
              <div className="flex flex-col items-center justify-center z-2">
                <QueenBlack size={48} />
                Black
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="flex justify-center">
        <button
          onClick={createGameHandler}
          className="btn btn-primary text-neutral btn-xl rounded-sm mt-10 text-[0.9rem] uppercase tracking-[0.2rem] px-12"
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-dots loading-sm"></span>
          ) : (
            "Create Game"
          )}
        </button>
      </section>
    </div >
  );
}

export default GameSetup;
