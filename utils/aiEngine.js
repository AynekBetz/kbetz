import { trackLine, detectSteam, calculateEdge } from "./lineTracker.js";

// =========================
// 🧠 IMPLIED PROBABILITY
// =========================
function impliedProbability(odds) {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

// =========================
// 💰 EXPECTED VALUE
// =========================
function calculateEV(prob, odds) {
  const decimal = odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
  return prob * decimal - 1;
}

// =========================
// 🔥 CONFIDENCE ENGINE
// =========================
export function calculateConfidence(game) {
  const implied = impliedProbability(game.odds);

  const modelProb =
    implied +
    (game.lineMove * 0.01) +
    (game.sharp ? 0.05 : 0);

  const ev = calculateEV(modelProb, game.odds);

  let score = 50;

  if (ev > 0) score += ev * 100;
  if (game.sharp) score += 10;
  score += game.lineMove * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// =========================
// ⚠️ RISK LEVEL
// =========================
export function getRiskLevel(conf) {
  if (conf >= 75) return "SAFE";
  if (conf >= 60) return "MEDIUM";
  return "RISKY";
}

// =========================
// 🔥 TOP PLAYS (PRO EDGE)
// =========================
export function generateTopPlays(games) {
  return games
    .map((g) => {
      trackLine(g);

      const confidence = calculateConfidence(g);
      const steam = detectSteam(g);
      const edge = calculateEdge(g);

      return {
        ...g,
        confidence,
        risk: getRiskLevel(confidence),
        steam,
        edge,
      };
    })
    .sort((a, b) => b.edge - a.edge)
    .slice(0, 5);
}

// =========================
// 💰 SMART PARLAY
// =========================
export function generateParlay(games) {
  const top = generateTopPlays(games);

  const legs = top.filter((g) => g.confidence >= 65).slice(0, 3);

  let totalOdds = 1;
  let prob = 1;

  legs.forEach((l) => {
    const decimal =
      l.odds > 0 ? 1 + l.odds / 100 : 1 + 100 / Math.abs(l.odds);

    totalOdds *= decimal;

    const p = impliedProbability(l.odds);
    prob *= p;
  });

  return {
    legs,
    totalOdds: totalOdds.toFixed(2),
    estimatedHitRate: prob,
  };
}