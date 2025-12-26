const { computeStandings } = require("./standings.service");
const { playMatch } = require("./simulation.service");

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function buildTeamsById(teams) {
  return teams.reduce((acc, t) => (acc[t.id] = t, acc), {});
}

function predictChampionPercent(teams, fixture, simulations = 1000) {
  const teamsById = buildTeamsById(teams);
  const unplayed = fixture.filter(m => !m.played);

  // Lig bitmişse:
  if (unplayed.length === 0) {
    const finalTable = computeStandings(teams, fixture);
    const out = {};
    finalTable.forEach((r, i) => out[r.teamId] = (i === 0 ? 100 : 0));
    return out;
  }

  const wins = {};
  teams.forEach(t => wins[t.id] = 0);

  for (let i = 0; i < simulations; i++) {
    const fx = deepClone(fixture);

    // kalan maçları oynat
    fx.filter(m => !m.played).forEach(m => {
      playMatch(m, teamsById);
    });

    const table = computeStandings(teams, fx);
    wins[table[0].teamId] += 1;
  }

  const perc = {};
  Object.keys(wins).forEach(id => {
    perc[id] = Math.round((wins[id] / simulations) * 100);
  });

  // yuvarlama düzeltmesi
  const sum = Object.values(perc).reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    const now = computeStandings(teams, fixture);
    const leader = now[0]?.teamId || teams[0].id;
    perc[leader] += (100 - sum);
  }

  return perc;
}

module.exports = { predictChampionPercent };
