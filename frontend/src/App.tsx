import { BrowserRouter, Routes, Route } from "react-router";

import Home from "./pages/home";
import Game from "./pages/game";
import Layout from "./components/layout";

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
          path="/play/:gameId"
          element={
            <Layout>
              <Game />
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
