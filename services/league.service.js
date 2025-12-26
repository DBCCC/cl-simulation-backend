const Team = require("../models/Team");
const Match = require("../models/Match");
const { playMatch } = require("./simulation.service");
const { computeStandings } = require("./standings.service");
const { predictChampionPercent } = require("./prediction.service");

let state = null;

/** ---------- Helpers ---------- */

function getTotalWeeks(teamCount) {
  return (teamCount - 1) * 2;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Circle method round-robin (supports odd team count with BYE)
function generateRoundRobin(teamIds) {
  const teams = [...teamIds];
  if (teams.length % 2 === 1) teams.push("BYE");

  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;

  const list = [...teams]; // rotates
  const schedule = [];

  for (let r = 0; r < rounds; r++) {
    const pairings = [];

    for (let i = 0; i < half; i++) {
      const t1 = list[i];
      const t2 = list[n - 1 - i];

      if (t1 === "BYE" || t2 === "BYE") continue;

      // balance home/away by round parity
      const home = r % 2 === 0 ? t1 : t2;
      const away = r % 2 === 0 ? t2 : t1;
      pairings.push([home, away]);
    }

    schedule.push(pairings);

    // rotate (keep first fixed)
    const fixed = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop());
    list.splice(0, list.length, fixed, ...rest);
  }

  return schedule; // single round (weeks)
}

function createFixture(teamIds) {
  const shuffled = shuffle(teamIds);

  const firstLeg = generateRoundRobin(shuffled);
  const secondLeg = firstLeg.map((week) => week.map(([h, a]) => [a, h]));

  const weeks = [...firstLeg, ...secondLeg]; // double round-robin

  const fixture = [];
  let idCounter = 1;

  weeks.forEach((pairings, idx) => {
    const week = idx + 1;
    pairings.forEach(([home, away]) => {
      fixture.push(
        new Match({
          id: `M${idCounter++}`,
          week,
          homeTeamId: home,
          awayTeamId: away,
        })
      );
    });
  });

  return fixture;
}

function defaultTeams() {
  return [
    new Team({ id: "T1", name: "Lions", power: 90 }),
    new Team({ id: "T2", name: "Eagles", power: 70 }),
    new Team({ id: "T3", name: "Sharks", power: 50 }),
    new Team({ id: "T4", name: "Wolves", power: 30 }),
  ];
}

function validateTeams(teams) {
  if (!Array.isArray(teams) || teams.length < 2) {
    const err = new Error("INVALID_TEAMS");
    err.status = 400;
    throw err;
  }

  const ids = new Set();
  teams.forEach((t) => {
    if (!t.id || typeof t.id !== "string") {
      const err = new Error("INVALID_TEAM_ID");
      err.status = 400;
      throw err;
    }
    if (ids.has(t.id)) {
      const err = new Error("DUPLICATE_TEAM_ID");
      err.status = 400;
      throw err;
    }
    ids.add(t.id);

    const name = String(t.name ?? "").trim();
    if (name.length < 2 || name.length > 30) {
      const err = new Error("INVALID_TEAM_NAME");
      err.status = 400;
      throw err;
    }

    const power = Number(t.power);
    if (!Number.isFinite(power) || power < 1 || power > 100) {
      const err = new Error("INVALID_TEAM_POWER");
      err.status = 400;
      throw err;
    }
  });
}

/** ---------- Core State ---------- */

/**
 * initLeague can take optional custom teams:
 * initLeague([{id,name,power}, ...])
 * If not provided, uses defaultTeams().
 */
function initLeague(customTeams) {
  const teams = Array.isArray(customTeams)
    ? customTeams.map((t) => new Team(t))
    : defaultTeams();

  validateTeams(teams);

  const teamIds = teams.map((t) => t.id);
  const fixture = createFixture(teamIds);

  state = {
    teams,
    fixture,
    prediction: null,
    currentWeek: 1,
    resultsByWeek: {},
    standings: computeStandings(teams, fixture),
  };

  return state;
}

function getState() {
  if (!state) initLeague();
  return state;
}

/** ---------- Simulation ---------- */

function playWeek(week) {
  const st = getState();
  const totalWeeks = getTotalWeeks(st.teams.length);
  const w = Number(week || st.currentWeek);

  if (!Number.isInteger(w) || w < 1 || w > totalWeeks) {
    const err = new Error("INVALID_WEEK");
    err.status = 400;
    throw err;
  }

  const teamsById = st.teams.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const matches = st.fixture.filter((m) => m.week === w);

  matches.forEach((m) => {
    if (!m.played) playMatch(m, teamsById);
  });

  st.resultsByWeek[w] = matches;
  st.standings = computeStandings(st.teams, st.fixture);

  if (w >= 4) {
    st.prediction = predictChampionPercent(st.teams, st.fixture, 1500);
  }

  if (st.currentWeek === w && w < totalWeeks) st.currentWeek += 1;

  return st;
}

function playAll() {
  const st = getState();
  const totalWeeks = getTotalWeeks(st.teams.length);

  for (let w = st.currentWeek; w <= totalWeeks; w++) {
    playWeek(w);
  }
  return st;
}

function resetLeague(customTeams) {
  return initLeague(customTeams);
}

/** ---------- Queries ---------- */

function getWeek(week) {
  const st = getState();
  const w = Number(week);

  return {
    week: w,
    matches: st.fixture.filter((m) => m.week === w),
    standings: st.standings,
    prediction: st.prediction,
    currentWeek: st.currentWeek,
  };
}

function getWeeks() {
  const st = getState();
  const weeks = {};
  const totalWeeks = getTotalWeeks(st.teams.length);

  for (let w = 1; w <= totalWeeks; w++) {
    weeks[w] = st.fixture.filter((m) => m.week === w);
  }
  return weeks;
}

/** ---------- Edit Match ---------- */

function editMatch(matchId, homeGoals, awayGoals) {
  const st = getState();

  const match = st.fixture.find((m) => m.id === matchId);
  if (!match) {
    const err = new Error("MATCH_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  if (!Number.isInteger(homeGoals) || homeGoals < 0 || homeGoals > 20) {
    const err = new Error("INVALID_HOME_GOALS");
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(awayGoals) || awayGoals < 0 || awayGoals > 20) {
    const err = new Error("INVALID_AWAY_GOALS");
    err.status = 400;
    throw err;
  }

  match.played = true;
  match.homeGoals = homeGoals;
  match.awayGoals = awayGoals;

  st.resultsByWeek[match.week] = st.fixture.filter((m) => m.week === match.week);

  st.standings = computeStandings(st.teams, st.fixture);

  const maxPlayedWeek = Math.max(
    0,
    ...st.fixture.filter((m) => m.played).map((m) => m.week)
  );

  if (maxPlayedWeek >= 4) {
    st.prediction = predictChampionPercent(st.teams, st.fixture, 1500);
  } else {
    st.prediction = null;
  }

  const nextUnplayed = st.fixture.find((m) => !m.played);
  const totalWeeks = getTotalWeeks(st.teams.length);
  st.currentWeek = nextUnplayed ? nextUnplayed.week : totalWeeks;

  return st;
}

/** ---------- Update Team ---------- */

function updateTeam(teamId, updates) {
  const st = getState();

  const team = st.teams.find((t) => t.id === teamId);
  if (!team) {
    const err = new Error("TEAM_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  if (updates.name !== undefined) {
    const name = String(updates.name).trim();
    if (name.length < 2 || name.length > 30) {
      const err = new Error("INVALID_TEAM_NAME");
      err.status = 400;
      throw err;
    }
    team.name = name;
  }

  if (updates.power !== undefined) {
    const power = Number(updates.power);
    if (!Number.isFinite(power) || power < 1 || power > 100) {
      const err = new Error("INVALID_TEAM_POWER");
      err.status = 400;
      throw err;
    }
    team.power = Math.round(power);
  }

  st.standings = computeStandings(st.teams, st.fixture);

  const maxPlayedWeek = Math.max(
    0,
    ...st.fixture.filter((m) => m.played).map((m) => m.week)
  );
  if (maxPlayedWeek >= 4) {
    st.prediction = predictChampionPercent(st.teams, st.fixture, 1500);
  }

  return st; // ✅ always return full state
}

module.exports = {
  // fixture
  createFixture,

  // state
  initLeague,
  resetLeague,
  getState,

  // simulation
  playWeek,
  playAll,

  // queries
  getWeek,
  getWeeks,

  // edits
  editMatch,
  updateTeam,
};
