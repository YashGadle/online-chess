import { useState, type RefObject } from "react";

import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";

import { Clipboard } from "lucide-react";

import * as apiClient from "../utils/api-client";
import { useAppContext } from "../context/app";

type PropsT = {
  ref: RefObject<HTMLDialogElement | null>;
};

const CreateGameModal = (props: PropsT) => {
  const [startGameUrl, setStartGameUrl] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [enableStartGameButton, setEnableStartGameButton] = useState(false);
  const [color, setColor] = useState<"white" | "black">("white");
  const [time, setTime] = useState("");

  const navigate = useNavigate();
  const { showToast } = useAppContext();

  const { mutate, isPending } = useMutation({
    mutationKey: ["createGame"],
    mutationFn: apiClient.createGame,
    onSuccess: (data) => {
      if (!data) return;

      setStartGameUrl(data.gameUrl);
      setInviteUrl(data.inviteUrl);
      showToast({
        type: "success",
        message: "Game created!",
      });
    },
    onError: (err) => {
      console.log(err);
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
    mutate({ color, time });
  };

  const copyText = () => {
    navigator.clipboard
      .writeText(location.origin + inviteUrl)
      .then(() => {
        setEnableStartGameButton(true);
        showToast({
          type: "info",
          message: "Invite copied to clipboard, now send it to your friend",
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  const handleColorInput = (e: React.ChangeEvent<HTMLFieldSetElement>) => {
    if (e.target instanceof HTMLInputElement) {
      setColor(e.target.value as "white" | "black");
    }
  };
  const handleTimeInput = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTime(e.target.value);
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
          <fieldset className="flex gap-4" onChange={handleColorInput}>
            <span>Choose color:</span>
            <label>
              <input
                id="white"
                type="radio"
                name="color"
                value="white"
                defaultChecked
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

          <select
            defaultValue="default"
            className="select"
            onChange={handleTimeInput}
          >
            <option value="default" disabled>
              Select time control
            </option>
            <option id="15|10" value="15|10">
              15 min + 10 secs increment
            </option>
            <option id="10|5" value="10|5">
              10 min + 5 secs increment
            </option>
            <option id="5|3" value="5|3">
              5 min + 3 secs increment
            </option>
          </select>
        </form>

        {inviteUrl && (
          <div className="flex flex-col">
            <button className="btn btn-dash btn-info" onClick={copyText}>
              <Clipboard /> Click here to get the Invite
            </button>
          </div>
        )}
        {startGameUrl && (
          <button
            className="btn btn-accent mt-2 w-full"
            onClick={() => navigate(startGameUrl)}
            disabled={!enableStartGameButton}
          >
            Go to Game
          </button>
        )}

        <div className="modal-action">
          <form
            method="dialog"
            className="flex  gap-3 justify-center items-center"
          >
            {!startGameUrl && (
              <>
                <button
                  className="btn btn-outline btn-primary"
                  onClick={createGameHandler}
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="loading loading-dots loading-sm"></span>
                  ) : (
                    "Create Game"
                  )}
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
