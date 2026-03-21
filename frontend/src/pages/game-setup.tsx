import { useState } from 'react';
import { Tile } from "../components/tile";

import QueenWhite from '../assets/QueenWhite';
import QueenBlack from '../assets/QueenBlack';

import { timeControlOptions } from "../utils/time-control";

import './game-setup.css';

const WHITE = 'w', BLACK = 'b', RANDOM = '?';

const GameSetup = () => {
  const [timeControl, setTimeControl] = useState("3|1");
  const [color, setColor] = useState(RANDOM);

  const onTimeControlClick = (tC: string) => {
    setTimeControl(tC);
  }
  const onColorPick = (option: "w" | "b" | "?") => {
    setColor(option);
  }

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
              <div className="bubble-content bg-tertiary" />
            </div>
            <button className={`anchor bg-base-300 ${color === WHITE && "active"}`} onClick={() => onColorPick(WHITE)}>
              <div className="z-2">
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
              <div className="z-2">
                <QueenBlack size={48} />
                Black
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="flex justify-center">
        <button
          //     onClick={onStartClick}
          className="btn btn-primary text-neutral btn-xl rounded-sm mt-10 text-[0.9rem] uppercase tracking-[0.2rem] px-12"
        >
          Create Game
        </button>
      </section>
    </div >
  );
}

export default GameSetup;
