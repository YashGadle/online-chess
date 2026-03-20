import { useNavigate } from "react-router";

const Home = () => {
  const navigate = useNavigate();
  const onStartClick = () => {
    navigate("/game-setup", {
      viewTransition: true
    });
  }
  return (
    <div className="mx-auto mt-0 lg:mt-14">
      <div className="flex flex-col items-center">
        <p className="tracking-[0.5em] uppercase text-secondary">
          Tactician Platform
        </p>
        <h1 className="text-[clamp(1.8rem,6vw+1rem,8rem)]">
          <i>The Art Of <span className="text-secondary">Strategy</span></i>
        </h1>
        <p className="text-[1.5rem] text-center text-balance lg:w-[70%] font-light">The board is set, the pieces are waiting.
          Summon an opponent with a single link and begin your duel in an
          environment of total focus.
        </p>
        <button
          onClick={onStartClick}
          className="btn btn-primary btn-xl rounded-sm mt-10 text-[0.9rem] uppercase tracking-[0.2rem] px-12"
        >
          Start a New Game
        </button>
      </div>
    </div>
  );
};

export default Home;
