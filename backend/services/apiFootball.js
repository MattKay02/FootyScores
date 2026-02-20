const axios = require("axios");
const { LEAGUES } = require("../constants/leagues");

const API_BASE = "https://v3.football.api-sports.io";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "x-apisports-key": process.env.API_FOOTBALL_KEY,
  },
});

const transformFixture = (entry) => {
  const { fixture, teams, goals } = entry;
  const [date, timePart] = fixture.date.split("T");

  return {
    fixtureId: fixture.id,
    date,
    time: timePart.slice(0, 5),
    status: fixture.status.long,
    statusShort: fixture.status.short,
    minute: fixture.status.elapsed,
    homeTeam: {
      id: teams.home.id,
      name: teams.home.name,
      crest: teams.home.logo,
    },
    awayTeam: {
      id: teams.away.id,
      name: teams.away.name,
      crest: teams.away.logo,
    },
    score: {
      home: goals.home,
      away: goals.away,
    },
  };
};

const fetchCurrentFixtures = async () => {
  const { premierLeague } = LEAGUES;
  const response = await apiClient.get("/fixtures", {
    params: {
      league: premierLeague.id,
      season: premierLeague.season,
      round: "Regular Season - 38",
    },
  });

  const raw = response.data.response;
  const matchweek = raw.length > 0 ? raw[0].league.round : null;
  const fixtures = raw.map(transformFixture);

  return {
    league: premierLeague.name,
    leagueId: premierLeague.id,
    season: premierLeague.season,
    matchweek,
    fixtures,
  };
};

const transformStandingEntry = (entry) => ({
  rank: entry.rank,
  team: {
    id: entry.team.id,
    name: entry.team.name,
    crest: entry.team.logo,
  },
  played: entry.all.played,
  win: entry.all.win,
  draw: entry.all.draw,
  lose: entry.all.lose,
  goalsDiff: entry.goalsDiff,
  points: entry.points,
});

const fetchStandings = async () => {
  const { premierLeague } = LEAGUES;
  const response = await apiClient.get("/standings", {
    params: {
      league: premierLeague.id,
      season: premierLeague.season,
    },
  });

  const raw = response.data.response[0].league.standings[0];
  return {
    league: premierLeague.name,
    leagueId: premierLeague.id,
    season: premierLeague.season,
    standings: raw.map(transformStandingEntry),
  };
};

module.exports = { fetchCurrentFixtures, fetchStandings };
