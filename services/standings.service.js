function computeStandings(teams, fixture) {
  const table = {};
  teams.forEach(t => {
    table[t.id] = {
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
    };
  });

  fixture.filter(m => m.played).forEach(m => {
    const home = table[m.homeTeamId];
    const away = table[m.awayTeamId];

    home.played++; away.played++;

    home.gf += m.homeGoals; home.ga += m.awayGoals;
    away.gf += m.awayGoals; away.ga += m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      home.win++; away.loss++;
      home.points += 3;
    } else if (m.homeGoals < m.awayGoals) {
      away.win++; home.loss++;
      away.points += 3;
    } else {
      home.draw++; away.draw++;
      home.points += 1;
      away.points += 1;
    }
  });

  Object.values(table).forEach(r => {
    r.gd = r.gf - r.ga;
  });

  return Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamName.localeCompare(b.teamName);
  });
}

module.exports = { computeStandings };
