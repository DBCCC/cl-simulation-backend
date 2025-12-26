const express = require("express");
const cors = require("cors");

const leagueRoutes = require("./routes/league.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/league", leagueRoutes);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    teamNames: (require("./services/league.service").getState()?.teams || []).map(t => t.name),
  });
});
app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    error: err.message || "INTERNAL_SERVER_ERROR",
    status,
  });
});

module.exports = app;
