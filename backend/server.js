// backend/server.js
const app = require("./app");
const PORT = process.env.PORT || 3060;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SSE Server] Rodando em http://localhost:${PORT}`);
});