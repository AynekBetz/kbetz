let cachedData = [];

// ✅ used by /api/lines
export function getCachedEvents() {
  return cachedData;
}

// ✅ main scanner
export function startScanner(callback) {
  console.log("Starting live scanner...");

  setInterval(() => {
    const data = [
      {
        game: "Lakers vs Warriors",
        book: "DraftKings",
        market: "Spread",
        odds: -106,
        previous_odds: -111,
        movement: 5,
        steam: false,
        ev: 1.2,
      },
      {
        game: "Celtics vs Knicks",
        book: "FanDuel",
        market: "Moneyline",
        odds: -108,
        previous_odds: -74,
        movement: 34,
        steam: true,
        ev: 5.5,
      },
      {
        game: "Bucks vs Heat",
        book: "BetMGM",
        market: "Spread",
        odds: -90,
        previous_odds: -117,
        movement: 27,
        steam: true,
        ev: 4.2,
      },
    ];

    cachedData = data;

    console.log("📡 SCANNER UPDATE:", data);

    if (callback) callback(data);
  }, 3000);
}