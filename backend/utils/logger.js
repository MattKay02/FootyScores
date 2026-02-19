const formatAge = (ageMs) => {
  const totalSeconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const timestamp = () => new Date().toISOString();

const logRefresh = (matchweek, count, durationMs) => {
  console.log(
    `[${timestamp()}] CACHE REFRESH — Premier League | Matchweek: ${matchweek} | Fixtures: ${count} | Duration: ${durationMs}ms`
  );
};

const logHit = (ageMs) => {
  console.log(
    `[${timestamp()}] CACHE HIT — Premier League | Age: ${formatAge(ageMs)} | Serving cached data`
  );
};

const logMiss = () => {
  console.log(
    `[${timestamp()}] CACHE MISS — Premier League | Outside active window | No fetch triggered`
  );
};

const logLive = (count) => {
  console.log(
    `[${timestamp()}] LIVE DETECTED — ${count} live fixtures | TTL reduced to 60s`
  );
};

module.exports = { logRefresh, logHit, logMiss, logLive };
