let cachedOdds = [];
let lastFetch = 0;

app.get("/api/odds", async (req, res) => {
  try {
    const now = Date.now();

    // 🔥 CACHE: only fetch every 5 minutes
    if (now - lastFetch < 5 * 60 * 1000 && cachedOdds.length > 0) {
      console.log("⚡ Using cached odds");
      return res.json(cachedOdds);
    }

    console.log("📡 Fetching fresh odds...");

    const url =
      `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/` +
      `?regions=eu&markets=h2h&bookmakers=bet365` +
      `&apiKey=${process.env.ODDS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.log("⚠️ API returned empty — using cache");

      if (cachedOdds.length > 0) {
        return res.json(cachedOdds);
      }

      return res.json([
        {
          team: "API LIMIT REACHED",
          home: "Using fallback",
          away: "Upgrade API plan",
          bestHome: { odds: "-", book: "-" },
          bestAway: { odds: "-", book: "-" }
        }
      ]);
    }

    const formatted = data.map((game) => {
      let bestHome = { odds: "-", book: "" };
      let bestAway = { odds: "-", book: "" };

      game.bookmakers?.forEach((b) => {
        const market = b.markets?.find((m) => m.key === "h2h");
        if (!market) return;

        market.outcomes.forEach((o) => {
          if (o.name === game.home_team) {
            bestHome = { odds: o.price, book: b.title };
          }
          if (o.name === game.away_team) {
            bestAway = { odds: o.price, book: b.title };
          }
        });
      });

      return {
        team: `${game.away_team} vs ${game.home_team}`,
        home: game.home_team,
        away: game.away_team,
        bestHome,
        bestAway
      };
    });

    // 🔥 SAVE CACHE
    cachedOdds = formatted;
    lastFetch = now;

    res.json(formatted);

  } catch (err) {
    console.log("❌ ERROR:", err);

    if (cachedOdds.length > 0) {
      return res.json(cachedOdds);
    }

    res.json([
      {
        team: "SYSTEM ERROR",
        home: "Try again later",
        away: "",
        bestHome: { odds: "-", book: "-" },
        bestAway: { odds: "-", book: "-" }
      }
    ]);
  }
});