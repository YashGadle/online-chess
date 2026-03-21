import { createBrowserRouter, RouterProvider } from "react-router";

import LandingPage from "./pages/landing";
import GameSetup from "./pages/game-setup";
import Game from "./pages/game";
import JoinGame from "./pages/join-game";
import WaitingRoom from "./pages/waiting-room";
import Layout from "./components/layout";

import { GameContextProvider } from "./context/game";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><LandingPage /></Layout>,
  },
  {
    path: "/game-setup",
    element: <Layout><GameSetup /></Layout>,
  },
  {
    path: "/waiting-room",
    element: <Layout><WaitingRoom /></Layout>,
  },
  {
    path: "/joinGame/:gameId",
    element: <Layout><JoinGame /></Layout>,
  },
  {
    path: "/play/:gameId",
    element: (
      <Layout>
        <GameContextProvider>
          <Game />
        </GameContextProvider>
      </Layout>
    ),
  },
  {
    path: "*",
    element: <Layout><div>Not found</div></Layout>,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
