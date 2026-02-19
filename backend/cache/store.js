const DEFAULT_TTL = 3600000;
const LIVE_TTL = 60000;

const cache = {
  data: null,
  cachedAt: null,
  ttl: DEFAULT_TTL,
};

const isStale = () => {
  if (!cache.data || !cache.cachedAt) return true;
  return cache.cachedAt + cache.ttl < Date.now();
};

const set = (data, ttl = DEFAULT_TTL) => {
  cache.data = data;
  cache.cachedAt = Date.now();
  cache.ttl = ttl;
};

const get = () => ({
  data: cache.data,
  cachedAt: cache.cachedAt,
});

module.exports = { isStale, set, get, DEFAULT_TTL, LIVE_TTL };
