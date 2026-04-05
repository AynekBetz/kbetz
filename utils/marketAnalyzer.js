// 🔥 EV CALCULATION
export const calculateEV = (odds) => {
  const fairProb = 0.5;

  const ev =
    (fairProb * (odds > 0 ? odds / 100 : 100 / Math.abs(odds))) -
    (1 - fairProb);

  return (ev * 100).toFixed(2);
};

// 🔵 ARBITRAGE DETECTION
export const findArbitrage = (oddsArray) => {
  if (!oddsArray || oddsArray.length < 2) {
    return { arbitrage: false };
  }

  const totalProb = oddsArray.reduce((sum, o) => {
    return sum + (
      o > 0
        ? 100 / (o + 100)
        : Math.abs(o) / (Math.abs(o) + 100)
    );
  }, 0);

  if (totalProb < 1) {
    return {
      arbitrage: true,
      edge: ((1 - totalProb) * 100).toFixed(2)
    };
  }

  return { arbitrage: false };
};

// 📈 LINE HISTORY
const lineHistory = {};

export const trackLine = (gameId, odds) => {
  if (!lineHistory[gameId]) {
    lineHistory[gameId] = [];
  }

  lineHistory[gameId].push({
    odds,
    time: Date.now()
  });

  if (lineHistory[gameId].length > 20) {
    lineHistory[gameId].shift();
  }

  return lineHistory[gameId];
};

// ⚡ STEAM DETECTION
export const detectSteamMove = (history) => {
  if (!history || history.length < 2) return false;

  const last = history[history.length - 1].odds;
  const prev = history[history.length - 2].odds;

  return Math.abs(last - prev) >= 10;
};

// 💰 ARBITRAGE BET SIZING (NEW)
export const calculateArbStake = (odds1, odds2, totalStake = 100) => {
  const prob1 = odds1 > 0
    ? 100 / (odds1 + 100)
    : Math.abs(odds1) / (Math.abs(odds1) + 100);

  const prob2 = odds2 > 0
    ? 100 / (odds2 + 100)
    : Math.abs(odds2) / (Math.abs(odds2) + 100);

  const totalProb = prob1 + prob2;

  const stake1 = (totalStake * prob1) / totalProb;
  const stake2 = (totalStake * prob2) / totalProb;

  const payout1 = stake1 * (odds1 > 0 ? odds1 / 100 + 1 : 100 / Math.abs(odds1) + 1);
  const payout2 = stake2 * (odds2 > 0 ? odds2 / 100 + 1 : 100 / Math.abs(odds2) + 1);

  const profit = Math.min(payout1, payout2) - totalStake;

  return {
    stake1: stake1.toFixed(2),
    stake2: stake2.toFixed(2),
    profit: profit.toFixed(2)
  };
};