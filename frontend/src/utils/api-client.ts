const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

export const createGame = async () => {
  const response = await fetch(`${BASE_URL}/createGame`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Error fetching hotels");
  }
  return response.json();
};

export const startGame = async (gameId: string) => {
  const response = await fetch(`${BASE_URL}/startGame/${gameId}`, {
    credentials: "include",
  });

  return response.json();
};
