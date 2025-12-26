function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// güç farkına göre gol üret (basit ama iş görür)
function simulateScore(homePower, awayPower) {
  const diff = homePower - awayPower;

  // beklenen goller
  let homeExp = 1.2 + diff / 50;   // güç yüksekse artar
  let awayExp = 1.0 - diff / 70;   // güç düşükse azalır

  // clamp
  homeExp = Math.max(0.2, Math.min(2.8, homeExp));
  awayExp = Math.max(0.2, Math.min(2.4, awayExp));

  // ufak rastgelelik
  const homeGoals = randInt(0, Math.round(homeExp + Math.random() * 1.5));
  const awayGoals = randInt(0, Math.round(awayExp + Math.random() * 1.3));

  return { homeGoals, awayGoals };
}

function playMatch(match, teamsById) {
  const home = teamsById[match.homeTeamId];
  const away = teamsById[match.awayTeamId];

  // home advantage (destekçi etkisi gibi) -> basit +5 güç
  const homePower = home.power + 5;
  const awayPower = away.power;

  const { homeGoals, awayGoals } = simulateScore(homePower, awayPower);

  match.played = true;
  match.homeGoals = homeGoals;
  match.awayGoals = awayGoals;

  return match;
}

module.exports = { playMatch };
