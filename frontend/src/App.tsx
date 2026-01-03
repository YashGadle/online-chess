import { BrowserRouter, Routes, Route } from "react-router";

import Home from "./pages/home";
import Game from "./pages/game";
import Layout from "./components/layout";
import StartGame from "./pages/start-game";

import { GameContextProvider } from "./context/game";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/startGame/:gameId"
          element={
            <Layout>
              <StartGame />
            </Layout>
          }
        />
        <Route
          path="/play/:gameId"
          element={
            <Layout>
              <GameContextProvider>
                <Game />
              </GameContextProvider>
            </Layout>
          }
        />
        <Route
          path="*"
          element={
            <Layout>
              <div>Not found</div>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
