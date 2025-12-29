import { useState, type RefObject } from "react";

import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { Clipboard } from "lucide-react";

import { createGame, startGame } from "../utils/api-client";
import { useAppContext } from "../context/app";

type PropsT = {
  ref: RefObject<HTMLDialogElement | null>;
};
const CreateGameModal = (props: PropsT) => {
  const [gameUrl, setGameUrl] = useState("");

  const navigate = useNavigate();
  const { showToast } = useAppContext();

  const { refetch: refetchCreateGame } = useQuery({
    queryKey: ["createGame"],
    queryFn: createGame,
    enabled: false,
    refetchOnWindowFocus: false,
  });
  const { refetch: refetchStartGame } = useQuery({
    queryKey: ["startGame"],
    queryFn: () => startGame(gameUrl),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  const createGameHandler = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const res = await refetchCreateGame();
    if (!res.data) return;
    setGameUrl(res.data?.data.gameUrl);
    showToast({
      type: "success",
      message: "Game created!",
    });
  };

  const startGameHandler = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const res = await refetchStartGame();
    if (!res.data) return;
    navigate(res.data.data.url);
  };

  const copyText = () => {
    navigator.clipboard
      .writeText(location.origin + gameUrl)
      .then(() => {
        showToast({
          type: "info",
          message: "Text copied to clipboard: " + gameUrl,
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  return (
    <dialog
      ref={props.ref}
      id="create-game-modal"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg">Game Settings</h3>
        <form className="flex flex-col gap-2 my-3">
          <fieldset className="flex gap-4">
            <span>Choose color:</span>
            <label>
              <input
                id="white"
                type="radio"
                name="color"
                value="white"
                className="mr-2"
              />
              White
            </label>
            <label>
              <input
                id="black"
                type="radio"
                name="color"
                value="black"
                className="mr-2"
              />
              Black
            </label>
          </fieldset>

          <select defaultValue="default" className="select">
            <option value="default" disabled>
              Select time control
            </option>
            <option id="15|10" value="15|10">
              15 min + 10 secs increment
            </option>
            <option id="10|5" value="10|5">
              10 min + 5 secs increment
            </option>
            <option id="5|2" value="5|2">
              5 min + 2 secs increment
            </option>
          </select>
        </form>

        {gameUrl && (
          <div className="flex flex-col">
            Share this URL with your friend: {`${location.origin}${gameUrl}`}
            <button onClick={copyText}>
              <Clipboard />
            </button>
            <button
              className="btn btn-dash btn-accent mt-2"
              onClick={startGameHandler}
            >
              Go to Game
            </button>
          </div>
        )}

        <div className="modal-action">
          <form
            method="dialog"
            className="flex  gap-3 justify-center items-center"
          >
            {!gameUrl && (
              <>
                <button
                  className="btn btn-outline btn-primary"
                  onClick={createGameHandler}
                >
                  Create Game
                </button>
                <button className="btn btn-outline btn-warning">Cancel</button>
              </>
            )}
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default CreateGameModal;
