import { Link, useLocation } from 'react-router';

import LandoText from './lando-text';

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="navbar h-17.5 px-6 bg-base-300 shadow-sm sticky mb-6">
      <Link
        className=""
        to="/"
        viewTransition={!isHome}
      >
        <LandoText className='uppercase text-2xl'>Tactician</LandoText>
      </Link>
    </nav>
  );
};

export default Navbar;
