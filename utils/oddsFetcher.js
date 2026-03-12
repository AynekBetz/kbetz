import fetch from "node-fetch";

const API_KEY = process.env.ODDS_API_KEY;

const ODDS_URL = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads&oddsFormat=american`;


/* =========================
   MOCK DATA FALLBACK
========================= */

function getMockOdds() {

  console.log("Using mock odds data (API quota reached)");

  return [
    {
      home_team: "Boston Celtics",
      away_team: "New York Knicks",
      bookmakers: [
        {
          title: "DraftKings",
          markets: [
            {
              outcomes: [
                { name: "Boston Celtics", price: -110 },
                { name: "New York Knicks", price: +120 }
              ]
            }
          ]
        },
        {
          title: "FanDuel",
          markets: [
            {
              outcomes: [
                { name: "Boston Celtics", price: -105 },
                { name: "New York Knicks", price: +125 }
              ]
            }
          ]
        }
      ]
    },

    {
      home_team: "Los Angeles Lakers",
      away_team: "Golden State Warriors",
      bookmakers: [
        {
          title: "BetMGM",
          markets: [
            {
              outcomes: [
                { name: "Los Angeles Lakers", price: +130 },
                { name: "Golden State Warriors", price: -140 }
              ]
            }
          ]
        },
        {
          title: "Caesars",
          markets: [
            {
              outcomes: [
                { name: "Los Angeles Lakers", price: +135 },
                { name: "Golden State Warriors", price: -150 }
              ]
            }
          ]
        }
      ]
    }
  ];

}


/* =========================
   FETCH ODDS
========================= */

export async function fetchOdds() {

  try {

    console.log("Requesting odds from Odds API...");

    const response = await fetch(ODDS_URL);

    const data = await response.json();

    if (data.error_code === "OUT_OF_USAGE_CREDITS") {

      console.log("Odds API quota reached");
      return getMockOdds();

    }

    if (!Array.isArray(data)) {

      console.log("Unexpected API response, using mock odds");
      return getMockOdds();

    }

    console.log("Odds received:", data.length);

    return data;

  } catch (error) {

    console.error("Odds API error:", error);

    return getMockOdds();

  }

}