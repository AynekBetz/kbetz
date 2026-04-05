// in-memory store (can upgrade to DB later)
const lineHistory = {};

// =========================
// 📈 TRACK LINE MOVES
// =========================
export function trackLine(game) {
  if (!lineHistory[game.id]) {
    lineHistory[game.id] = [];
  }

  lineHistory[game.id].push({
    odds: game.odds,
    time: Date.now(),
  });

  return lineHistory[game.id];
}

// =========================
// 🔥 DETECT STEAM
// =========================
export function detectSteam(game) {
  const history = lineHistory[game.id];

  if (!history || history.length < 2) return false;

  const last = history[history.length - 1];
  const prev = history[history.length - 2];

  const move = Math.abs(last.odds - prev.odds);

  return move >= 15; // big move = steam
}

// =========================
// 💰 EDGE SCORE
// =========================
export function calculateEdge(game) {
  let edge = 0;

  if (game.sharp) edge += 15;
  if (game.lineMove > 2) edge += 10;
  if (game.ev > 0) edge += game.ev * 5;

  return Math.min(100, Math.round(edge));
}