const leagueService = require("../services/league.service");

const getLeague = (req, res) => {
  res.json(leagueService.getState());
};

const playWeek = (req, res) => {
  const week = Number(req.params.week);
  res.json(leagueService.playWeek(week));
};

const playAll = (req, res) => {
  res.json(leagueService.playAll());
};

const reset = (req, res) => {
  res.json(leagueService.resetLeague());
};

const getWeek = (req, res) => {
  res.json(leagueService.getWeek(req.params.week));
};

const getWeeks = (req, res) => {
  res.json(leagueService.getWeeks());
};

const editMatch = (req, res) => {
  const matchId = req.params.matchId;

  const homeGoals = Number(req.body.homeGoals);
  const awayGoals = Number(req.body.awayGoals);

  try {
    const st = leagueService.editMatch(matchId, homeGoals, awayGoals);
    res.json(st);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};


const updateTeam = (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, power } = req.body || {};
    const result = leagueService.updateTeam(teamId, { name, power });
    res.json(result);
  } catch (err) {
    const error = new Error("INVALID_TEAM_POWER (1-100)");
error.status = 400;
throw error;
  }
};

module.exports = {
  updateTeam,
  getLeague,
  playWeek,
  playAll,
  reset,
  getWeek,
  getWeeks,
  editMatch,
};
