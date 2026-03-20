import { Link, useLocation } from 'react-router';

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="navbar bg-base-300 shadow-sm sticky mb-6">
      <Link
        className="btn btn-ghost text-xl tracking-widest uppercase"
        to="/"
        viewTransition={!isHome}
      >
        Tactician
      </Link>
    </nav>
  );
};

export default Navbar;
