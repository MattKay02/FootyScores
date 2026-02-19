require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fixturesRouter = require("./routes/fixtures");
const { startScheduler } = require("./scheduler/refreshScheduler");
const { get } = require("./cache/store");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/fixtures", fixturesRouter);

app.get("/health", (req, res) => {
  const { cachedAt } = get();
  const ageMs = cachedAt ? Date.now() - cachedAt : null;
  const totalSeconds = ageMs !== null ? Math.floor(ageMs / 1000) : null;
  const cacheAge =
    totalSeconds !== null
      ? `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
      : "no data";

  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    cacheAge,
    lastRefresh: cachedAt ? new Date(cachedAt).toISOString() : null,
  });
});

startScheduler();

app.listen(PORT, () => {
  console.log(
    `[${new Date().toISOString()}] FootyScores backend running on port ${PORT}`
  );
});
