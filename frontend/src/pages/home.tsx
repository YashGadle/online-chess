import { useRef } from "react";

import CreateGameModal from "../components/create-game-modal";

const Home = () => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const openModal = () => modalRef.current?.showModal();

  return (
    <>
      <div className="flex flex-col gap-4 justify-center items-center mx-auto min-w-100 max-w-[35%]">
        <div className="text-5xl font-bold text-center">Online Chess</div>
        <p className="text-center">
          Play for free with a friend online.{" "}
          <u>No Subscriptions, Logins or Payments.</u> Just click the button
          below to start playing
        </p>
        <button className="btn btn-soft btn-primary btn-xl" onClick={openModal}>
          Create Game
        </button>
      </div>
      <CreateGameModal ref={modalRef} />
    </>
  );
};

export default Home;
