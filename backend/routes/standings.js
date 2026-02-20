const express = require("express");
const { fetchStandings } = require("../services/apiFootball");
const { isStale, set, get } = require("../cache/standingsStore");

const router = express.Router();

router.get("/premier-league", async (req, res) => {
  const { data, cachedAt } = get();

  if (!isStale()) {
    return res.json({ ...data, cachedAt: new Date(cachedAt).toISOString() });
  }

  try {
    const freshData = await fetchStandings();
    set(freshData);
    const { data: cached, cachedAt: newCachedAt } = get();
    return res.json({ ...cached, cachedAt: new Date(newCachedAt).toISOString() });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] STANDINGS FETCH ERROR — ${err.message}`);

    if (data) {
      return res.json({
        ...data,
        cachedAt: new Date(cachedAt).toISOString(),
        stale: true,
      });
    }

    return res.status(503).json({ error: "Standings temporarily unavailable" });
  }
});

module.exports = router;
