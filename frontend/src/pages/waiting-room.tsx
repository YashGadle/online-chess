import { useLocation, useNavigate } from 'react-router';
import { useAppContext } from '../context/app';

const WaitingRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const getInviteUrl = () => {
    let str = queryParams.get('inviteUrl') || '';
    try {
      str = atob(str);
    } catch (err) {
      console.log(err);
    }
    return str;
  }

  const getJoinUrl = () => {
    let str = queryParams.get('joinUrl') || '';
    try {
      str = atob(str);
    } catch (err) {
      console.log(err);
    }
    return str;
  }

  const { showToast } = useAppContext()

  const copyText = () => {
    navigator.clipboard
      .writeText(window.location.origin + getInviteUrl())
      .then(() => {
        showToast({
          type: "info",
          message: "Invite copied to clipboard, now send it to your friend",
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  const joinGame = () => {
    navigate(getJoinUrl(), { viewTransition: true });
  }

  return (
    <div className="mx-8 lg:mx-20 mt-0 lg:mt-30" >
      <div className='flex flex-col lg:flex-row justify-between items-center'>

        <section className='flex flex-col items-start flex-1 justify-center'>
          <p className="tracking-[0.5em] text-[0.8rem] uppercase text-secondary mb-4">
            Waiting Room
          </p>

          <h1 className='text-[clamp(1.8rem,5vw+1rem,10rem)] leading-none uppercase'>
            <span className='font-bold'>Summon</span>{` `}
            <span className='font-bold inline lg:block'>Your</span>
            <span className='text-secondary font-light block'><i>Opponent</i></span>
          </h1>
          <p className='text-accent-content text-[1.3rem] text-balance lg:mt-6'>
            A secure link has been generated. Share it with your friend to initiate the game.
            Good Luck!
          </p>
        </section>

        <section className='max-md:mt-6 flex-1 max-w-[90vw]'>
          <div className='bg-tertiary-200 p-4 lg:p-10 rounded-lg bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-secondary)_20%,transparent)_0%,transparent_30%)]'>
            <p className='uppercase text-accent-content text-[0.8rem] mb-3'>Secure Invitation Link</p>
            <div className='flex justify-between items-center p-4 bg-neutral '>
              <span className='truncate'>{getInviteUrl() ? getInviteUrl() : 'URL not found'}</span>
              <button
                onClick={copyText}
                className='btn btn-primary text-neutral uppercase tracking-wide font-medium'>
                Copy Link
              </button>
            </div>
            <div className='w-full mt-4 text-center'>
              <button
                onClick={joinGame}
                className='btn btn-primary text-neutral text-[1.2rem] px-8 uppercase tracking-widest'
              >
                Join Game
              </button>
            </div>
            <div className='mt-6'>
              <span className='text-[1.5rem]'><i>Recent Adversaries</i></span>
              <hr className='w-full text-accent-content' />
              <div className='mt-4'>Coming Soon!</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
};

export default WaitingRoom;
