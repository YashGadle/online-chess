import axios from "./axios";

export const createGame = async () => {
  const res = await axios.get("/createGame", { withCredentials: true });
  return res;
};

export const startGame = async (url: string) => {
  const res = await axios.get(url, { withCredentials: true });
  return res;
};
