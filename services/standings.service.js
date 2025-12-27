

function getHeadToHead(aId, bId, fixture) {
  const h2h = fixture.filter(
    (m) =>
      m.played &&
      ((m.homeTeamId === aId && m.awayTeamId === bId) ||
        (m.homeTeamId === bId && m.awayTeamId === aId))
  );

  let ptsA = 0;
  let gfA = 0;
  let gaA = 0;

  for (const m of h2h) {
    const aIsHome = m.homeTeamId === aId;
    const aGoals = aIsHome ? m.homeGoals : m.awayGoals;
    const bGoals = aIsHome ? m.awayGoals : m.homeGoals;

    gfA += aGoals;
    gaA += bGoals;

    if (aGoals > bGoals) ptsA += 3;
    else if (aGoals === bGoals) ptsA += 1;
  }

  const gdA = gfA - gaA;

  return { ptsA, gfA, gaA, gdA, played: h2h.length };
}

function compareHeadToHead(a, b, fixture) {
  const h2hA = getHeadToHead(a.teamId, b.teamId, fixture);
  const h2hB = getHeadToHead(b.teamId, a.teamId, fixture);

  if (h2hA.played === 0) return 0;

  if (h2hA.ptsA !== h2hB.ptsA) return h2hB.ptsA - h2hA.ptsA;

  if (h2hA.gdA !== h2hB.gdA) return h2hB.gdA - h2hA.gdA;

  if (h2hA.gfA !== h2hB.gfA) return h2hB.gfA - h2hA.gfA;

  return 0;
}

function computeStandings(teams, fixture) {
  const table = teams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    played: 0,
    win: 0,
    draw: 0,
    loss: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  }));

  const byId = Object.fromEntries(table.map((r) => [r.teamId, r]));

  for (const m of fixture) {
    if (!m.played) continue;

    const home = byId[m.homeTeamId];
    const away = byId[m.awayTeamId];

    home.played += 1;
    away.played += 1;

    home.gf += m.homeGoals;
    home.ga += m.awayGoals;

    away.gf += m.awayGoals;
    away.ga += m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      home.win += 1;
      away.loss += 1;
      home.points += 3;
    } else if (m.homeGoals < m.awayGoals) {
      away.win += 1;
      home.loss += 1;
      away.points += 3;
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const r of table) {
    r.gd = r.gf - r.ga;
  }

  table.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;

    if (a.gd !== b.gd) return b.gd - a.gd;

    if (a.gf !== b.gf) return b.gf - a.gf;

    if (a.ga !== b.ga) return a.ga - b.ga;

    const h2h = compareHeadToHead(a, b, fixture);
    if (h2h !== 0) return h2h;

    return a.teamName.localeCompare(b.teamName);
  });

  return table;
}

module.exports = { computeStandings };
