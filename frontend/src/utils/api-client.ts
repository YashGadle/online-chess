const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

export const createGame = async (data: {
  color: "white" | "black";
  time: string;
}) => {
  const response = await fetch(`${BASE_URL}/createGame`, {
    method: "post",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
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
