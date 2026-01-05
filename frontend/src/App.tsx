import { BrowserRouter, Routes, Route } from "react-router";

import Home from "./pages/home";
import Game from "./pages/game";
import Layout from "./components/layout";
import JoinGame from "./pages/join-game";

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
          path="/joinGame/:gameId"
          element={
            <Layout>
              <JoinGame />
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
