const ws = new WebSocket("ws://localhost:8080");

ws.addEventListener("open", (event) => {
  console.log("Connection successful", event);
});
ws.addEventListener("error", (error) => {
  console.log("Couldn't connect", error);
});

ws.addEventListener("message", (event) => {
  console.log("Message received", event);
});

export default ws;
