// services/standings.service.js

function getHeadToHead(aId, bId, fixture) {
  // only played matches between A and B
  const h2h = fixture.filter(
    (m) =>
      m.played &&
      ((m.homeTeamId === aId && m.awayTeamId === bId) ||
        (m.homeTeamId === bId && m.awayTeamId === aId))
  );

  // points, goals for/against from A perspective
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

  // If there are no head-to-head played matches yet, can't decide
  if (h2hA.played === 0) return 0;

  // 1) head-to-head points
  if (h2hA.ptsA !== h2hB.ptsA) return h2hB.ptsA - h2hA.ptsA;

  // 2) head-to-head goal difference
  if (h2hA.gdA !== h2hB.gdA) return h2hB.gdA - h2hA.gdA;

  // 3) head-to-head goals for (opsiyonel ama mantıklı)
  if (h2hA.gfA !== h2hB.gfA) return h2hB.gfA - h2hA.gfA;

  return 0;
}

function computeStandings(teams, fixture) {
  // --- burası sende zaten var: played/win/draw/loss/gf/ga/gd/points hesapla ---
  // Aşağıdaki "table" senin var olan standings array'in olsun:
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

  // ✅ UPDATED SORT: points > gd > gf > ga (if you used ga) > head-to-head
  table.sort((a, b) => {
    // 1) points desc
    if (a.points !== b.points) return b.points - a.points;

    // 2) goal difference desc
    if (a.gd !== b.gd) return b.gd - a.gd;

    // 3) goals for desc
    if (a.gf !== b.gf) return b.gf - a.gf;

    // 4) goals against asc (daha az yiyen üstte) — sen şartta GA eşit diyorsun ama yine de kalsın
    if (a.ga !== b.ga) return a.ga - b.ga;

    // 5) head-to-head (ikili averaj)
    const h2h = compareHeadToHead(a, b, fixture);
    if (h2h !== 0) return h2h;

    // 6) final fallback: teamName alphabetic (stable deterministic)
    return a.teamName.localeCompare(b.teamName);
  });

  return table;
}

module.exports = { computeStandings };
