const express = require("express");
const { fetchCurrentFixtures } = require("../services/apiFootball");
const { isStale, set, get, DEFAULT_TTL, LIVE_TTL } = require("../cache/store");
const { logHit, logRefresh, logLive } = require("../utils/logger");

const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET"]);

const router = express.Router();

router.post("/premier-league/refresh", async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const freshData = await fetchCurrentFixtures();
    const liveCount = freshData.fixtures.filter((f) =>
      LIVE_STATUSES.has(f.statusShort)
    ).length;
    const ttl = liveCount > 0 ? LIVE_TTL : DEFAULT_TTL;

    set(freshData, ttl);
    const { cachedAt } = get();
    return res.json({ ...freshData, cachedAt: new Date(cachedAt).toISOString() });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] FORCE REFRESH ERROR — ${err.message}`);
    return res.status(502).json({ error: err.message });
  }
});

router.get("/premier-league", async (req, res) => {
  const { data, cachedAt } = get();

  if (!isStale()) {
    logHit(Date.now() - cachedAt);
    return res.json({ ...data, cachedAt: new Date(cachedAt).toISOString() });
  }

  const start = Date.now();

  try {
    const freshData = await fetchCurrentFixtures();
    const liveCount = freshData.fixtures.filter((f) =>
      LIVE_STATUSES.has(f.statusShort)
    ).length;
    const ttl = liveCount > 0 ? LIVE_TTL : DEFAULT_TTL;

    if (liveCount > 0) {
      logLive(liveCount);
    }

    set(freshData, ttl);
    logRefresh(freshData.matchweek, freshData.fixtures.length, Date.now() - start);

    const { data: cached, cachedAt: newCachedAt } = get();
    return res.json({ ...cached, cachedAt: new Date(newCachedAt).toISOString() });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] FETCH ERROR — ${err.message}`);

    if (data) {
      return res.json({
        league: data.league,
        matchweek: data.matchweek,
        cachedAt: new Date(cachedAt).toISOString(),
        stale: true,
        fixtures: data.fixtures,
      });
    }

    return res.status(503).json({ error: "Data temporarily unavailable" });
  }
});

module.exports = router;
