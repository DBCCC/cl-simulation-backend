class Match {
  constructor({ id, week, homeTeamId, awayTeamId }) {
    this.id = id;
    this.week = week;
    this.homeTeamId = homeTeamId;
    this.awayTeamId = awayTeamId;

    this.played = false;
    this.homeGoals = null;
    this.awayGoals = null;
  }
}

module.exports = Match;
