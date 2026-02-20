const DEFAULT_TTL = 3600000;

const cache = {
  data: null,
  cachedAt: null,
  ttl: DEFAULT_TTL,
};

const isStale = () => {
  if (!cache.data || !cache.cachedAt) return true;
  return cache.cachedAt + cache.ttl < Date.now();
};

const set = (data) => {
  cache.data = data;
  cache.cachedAt = Date.now();
  cache.ttl = DEFAULT_TTL;
};

const get = () => ({
  data: cache.data,
  cachedAt: cache.cachedAt,
});

module.exports = { isStale, set, get };
