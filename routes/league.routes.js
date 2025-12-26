const express = require("express");
const router = express.Router();

const leagueController = require("../controllers/league.controller");

router.get("/", leagueController.getLeague);
router.post("/play-week/:week", leagueController.playWeek);
router.post("/play-all", leagueController.playAll);
router.post("/reset", leagueController.reset);
router.patch("/teams/:teamId", leagueController.updateTeam);
router.get("/week/:week", leagueController.getWeek);
router.get("/weeks", leagueController.getWeeks);
router.post("/edit-match/:matchId", leagueController.editMatch);

module.exports = router;
