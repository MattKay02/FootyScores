const { fetchCurrentFixtures } = require("../services/apiFootball");
const { isStale, set, DEFAULT_TTL, LIVE_TTL } = require("../cache/store");
const { logRefresh, logMiss, logLive } = require("../utils/logger");

const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET"]);

const PL_WINDOWS = [
  { day: 6, start: "12:25", end: "14:30" },
  { day: 6, start: "14:55", end: "17:05" },
  { day: 6, start: "17:25", end: "19:40" },
  { day: 6, start: "19:55", end: "22:10" },
  { day: 0, start: "13:55", end: "16:05" },
  { day: 0, start: "16:25", end: "18:40" },
  { day: 0, start: "19:55", end: "22:10" },
  { day: 2, start: "19:40", end: "22:10" },
  { day: 3, start: "19:40", end: "22:10" },
  { day: 4, start: "19:40", end: "22:10" },
  { day: 1, start: "19:55", end: "22:10" },
  { day: 5, start: "19:55", end: "22:10" },
];

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const isInActiveWindow = () => {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  return PL_WINDOWS.some(
    (w) =>
      w.day === currentDay &&
      currentMinutes >= toMinutes(w.start) &&
      currentMinutes <= toMinutes(w.end)
  );
};

const runRefresh = async () => {
  if (!isStale()) return;

  if (!isInActiveWindow()) {
    logMiss();
    return;
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
  } catch (err) {
    console.error(`[${new Date().toISOString()}] SCHEDULER ERROR — ${err.message}`);
  }
};

const startScheduler = () => {
  runRefresh();
  setInterval(runRefresh, 60000);
};

module.exports = { startScheduler };
