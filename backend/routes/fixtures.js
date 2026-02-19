const express = require("express");
const { fetchCurrentFixtures } = require("../services/apiFootball");
const { isStale, set, get, DEFAULT_TTL, LIVE_TTL } = require("../cache/store");
const { logHit, logRefresh, logLive } = require("../utils/logger");

const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET"]);

const router = express.Router();

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
        cachedAt: new Date(cachedAt).toISOString(),
        stale: true,
        fixtures: data.fixtures,
      });
    }

    return res.status(503).json({ error: "Data temporarily unavailable" });
  }
});

module.exports = router;
