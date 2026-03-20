import { Tile } from "../components/tile";

import QueenWhite from '../assets/QueenWhite';
import QueenBlack from '../assets/QueenBlack';

const GameSetup = () => {
  const timeControl = [
    {
      title: "1 + 0",
      description: "Bullet",
      value: "1|0",
    },
    {
      title: "3 + 1",
      description: "Blitz",
      value: "3|1",
    },

    {
      title: "5 + 2",
      description: "Blitz",
      value: "5|2",
    },
    {
      title: "10 + 5",
      description: "Rapid",
      value: "10|5",
    },

  ];
  return (
    <div className="mx-auto mt-0 lg:mt-14">
      <div className="flex flex-col items-center">
        <p className="tracking-[0.5em] text-[0.8rem] uppercase text-secondary">
          Match Configuration
        </p>
        <h1 className="text-[clamp(1.8rem,6vw+1rem,5rem)]">
          <i>Set the Stage</i>
        </h1>
        <hr className="w-20 text-secondary" />
      </div>

      <div className="flex flex-col mt-14">
        <div className="flex justify-between">
          <span className="text-[1.5rem]"><i>Time Control</i></span>
          <span className="uppercase tracking-wide text-[0.8rem]">Minutes per side</span>
        </div>
        <hr className="w-full text-gray-700" />
        <div className="grid grid-cols-2 gap-4 mt-6 lg:grid-cols-4">
          {timeControl.map((time, idx) => (
            <Tile key={idx} title={time.title} subtitle={time.description} />
          ))}
        </div>
      </div>

      <div className="flex flex-col mt-14">
        <div>
          <span className="text-[1.5rem]"><i>Pick Color</i></span>
          <hr className="w-full text-gray-700" />
        </div>
        <div className="flex justify-center w-full mt-6">
          <div className="relative w-max flex justify-center overflow-hidden rounded-xl">
            <div className="bubble" />
            <span className="anchor bg-base-300">
              <div className="z-2">
                <QueenWhite size={48} />
                White
              </div>
            </span>
            <span className="anchor bg-base-300">
              <div className="z-2 text-center">
                <div className="question-mark text-5xl">?</div>
                Random
              </div>
            </span>
            <span className="anchor bg-base-300">
              <div className="z-2">
                <QueenBlack size={48} />
                Black
              </div>
            </span>
          </div>
        </div>
        <style>{`
          .question-mark {
            font-family: sans-serif;
            font-weight: 800;
            color: var(--color-base-300);
            -webkit-text-stroke: 1px white;
          }

          .anchor {
            width: 150px;
            height: 150px;
            text-transform: uppercase;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
          }

          .anchor:nth-of-type(1) {
            anchor-name: --item-1;
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
          }
          
          .anchor:nth-of-type(2) {
            anchor-name: --item-2;
          }

          .anchor:nth-of-type(3) {
            anchor-name: --item-3;
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
          }

          :root:has(.anchor:nth-of-type(1):hover) .bubble {
            position-anchor: --item-1;
          }
          :root:has(.anchor:nth-of-type(2):hover) .bubble {
            position-anchor: --item-2;
          }
          :root:has(.anchor:nth-of-type(3):hover) .bubble {
            position-anchor: --item-3;
          }

          .bubble {
            position: absolute;
            position-anchor: --item-2;
            left: anchor(left);
            top: anchor(top);
            width: anchor-size(width);
            height: anchor-size(height);
            transition: all 0.2s linear;
            pointer-events: none;
            background-color: gray;
          }
        `}</style>
      </div>

      <div className="flex justify-center">
        <button
     //     onClick={onStartClick}
          className="btn btn-primary btn-xl rounded-sm mt-10 text-[0.9rem] uppercase tracking-[0.2rem] px-12"
        >
          Start a New Game
        </button>
      </div>
    </div >
  );
}

export default GameSetup;
