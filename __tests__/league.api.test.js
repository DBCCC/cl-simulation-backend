const request = require("supertest");
const app = require("../app");

describe("League API", () => {

  test("POST /api/league/reset should reset league state", async () => {
    const res = await request(app)
      .post("/api/league/reset")
      .expect(200);

    expect(res.body.currentWeek).toBe(1);
    expect(res.body.prediction).toBe(null);
    const playedCount = res.body.fixture.filter(m => m.played).length;
    expect(playedCount).toBe(0);

    expect(res.body.standings).toHaveLength(4);
    res.body.standings.forEach(r => {
      expect(r.points).toBe(0);
      expect(r.played).toBe(0);
    });
  });

  test("POST /api/league/play-week/1 plays week 1 matches", async () => {
    await request(app).post("/api/league/reset");

    const res = await request(app)
      .post("/api/league/play-week/1")
      .expect(200);

    const week1Matches = res.body.fixture.filter(m => m.week === 1);
    expect(week1Matches).toHaveLength(2);

    week1Matches.forEach(m => {
      expect(m.played).toBe(true);
      expect(typeof m.homeGoals).toBe("number");
      expect(typeof m.awayGoals).toBe("number");
    });

    expect(res.body.currentWeek).toBe(2);
  });

  test("Prediction appears after week 4", async () => {
    await request(app).post("/api/league/reset");

    await request(app).post("/api/league/play-week/1");
    await request(app).post("/api/league/play-week/2");
    await request(app).post("/api/league/play-week/3");

    const res = await request(app)
      .post("/api/league/play-week/4")
      .expect(200);

    expect(res.body.prediction).not.toBe(null);
    expect(Object.keys(res.body.prediction))
      .toEqual(expect.arrayContaining(["T1", "T2", "T3", "T4"]));
  });

});
