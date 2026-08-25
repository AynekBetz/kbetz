/*
 * KBETZ VERIFIED AI PARLAY ENGINE
 *
 * Uses the same verified-market principles as KBETZ V3 Official Picks.
 *
 * This engine ranks market evidence. It does NOT claim guaranteed
 * outcomes or represent its scores as independent win probabilities.
 */

function americanToDecimal(odds) {
  const n = Number(odds);

  if (!Number.isFinite(n) || n === 0) return null;

  return n > 0
    ? 1 + n / 100
    : 1 + 100 / Math.abs(n);
}

function decimalToAmerican(decimal) {
  const d = Number(decimal);

  if (!Number.isFinite(d) || d <= 1) return null;

  if (d >= 2) {
    return Math.round((d - 1) * 100);
  }

  return Math.round(-100 / (d - 1));
}

function getRecommendedOdds(game) {
  const recommended = String(
    game?.recommended || game?.bestLine || ""
  ).toLowerCase();

  const home = String(game?.home || "").toLowerCase();
  const away = String(game?.away || "").toLowerCase();

  if (home && recommended.includes(home)) {
    return Number(game.homeOdds);
  }

  if (away && recommended.includes(away)) {
    return Number(game.awayOdds);
  }

  return null;
}

function qualifyGame(game) {
  if (!game) return null;

  const commenceMs = Date.parse(game.commenceTime || "");
  const now = Date.now();
  const maxTime = now + 48 * 60 * 60 * 1000;

  const source = String(game.source || "").toLowerCase();

  const consensus =
    Number(game.marketConsensusProbability || 0);

  const quality =
    Number(game.marketQualityScore || 0);

  const movement =
    Number(game.movementAgreement || 0);

  const books =
    Number(
      game.booksUsed ||
      (Array.isArray(game.books) ? game.books.length : 0)
    );

  const odds = getRecommendedOdds(game);

  const timeQualified =
    Number.isFinite(commenceMs) &&
    commenceMs > now &&
    commenceMs <= maxTime;

  const movementAvailable = movement > 0;

  const qualified =
    timeQualified &&
    ["live", "therundown"].includes(source) &&
    books >= 2 &&
    Number.isFinite(odds) &&
    consensus >= 58 &&
    quality >= 60 &&
    (!movementAvailable || movement >= 60);

  if (!qualified) return null;

  /*
   * Same V3 ranking philosophy used by Official Picks.
   * This is a market-selection score, not predicted win probability.
   */
  const selectionScore =
    quality * 0.50 +
    consensus * 0.30 +
    Math.min(books / 3, 1) * 10 +
    (movement > 0 ? movement * 0.10 : 0);

  return {
    id: game.id || game.gameId || "",
    sport: game.sport || game.league || "",
    away: game.away,
    home: game.home,
    commenceTime: game.commenceTime,

    team: game.recommended || game.bestLine,
    recommended: game.recommended || game.bestLine,

    odds,
    consensus: Number(consensus.toFixed(2)),
    marketQuality: Number(quality.toFixed(2)),
    movementAgreement: Number(movement.toFixed(2)),
    booksUsed: books,

    selectionScore: Number(selectionScore.toFixed(2))
  };
}

function uniqueQualifiedLegs(games = []) {
  const qualified = games
    .map(qualifyGame)
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(b.selectionScore || 0) -
        Number(a.selectionScore || 0)
    );

  const seenGames = new Set();
  const result = [];

  for (const leg of qualified) {
    /*
     * One selection per actual event.
     * Prevents duplicate/conflicting legs from the same game.
     */
    const gameKey = String(
      leg.id ||
      `${leg.away}|${leg.home}|${leg.commenceTime}`
    ).toLowerCase();

    if (seenGames.has(gameKey)) continue;

    seenGames.add(gameKey);
    result.push(leg);
  }

  return result;
}

function buildParlayCard(type, label, legs, minimumLegs) {
  if (legs.length < minimumLegs) {
    return {
      type,
      label,
      available: false,
      reason: `Not enough qualified markets for the ${label}.`,
      legs: []
    };
  }

  let combinedDecimal = 1;

  for (const leg of legs) {
    const decimal = americanToDecimal(leg.odds);

    if (!decimal) {
      return {
        type,
        label,
        available: false,
        reason: "A qualified leg is missing valid odds.",
        legs: []
      };
    }

    combinedDecimal *= decimal;
  }

  const combinedOdds =
    decimalToAmerican(combinedDecimal);

  const averageMarketQuality =
    legs.reduce(
      (sum, leg) => sum + leg.marketQuality,
      0
    ) / legs.length;

  const averageConsensus =
    legs.reduce(
      (sum, leg) => sum + leg.consensus,
      0
    ) / legs.length;

  const payoutFor = (stake) =>
    Number((stake * combinedDecimal).toFixed(2));

  return {
    type,
    label,
    available: true,
    risk:
      type === "safer"
        ? "Lower"
        : type === "balanced"
          ? "Medium"
          : "Higher",

    legs,
    legCount: legs.length,

    combinedDecimal:
      Number(combinedDecimal.toFixed(3)),

    combinedOdds,

    averageMarketQuality:
      Number(averageMarketQuality.toFixed(2)),

    averageConsensus:
      Number(averageConsensus.toFixed(2)),

    estimatedPayouts: {
      10: payoutFor(10),
      25: payoutFor(25),
      50: payoutFor(50)
    }
  };
}

/*
 * Generate the complete ready-made KBETZ AI Parlay Board.
 *
 * Safer:     strongest 2 qualified markets
 * Balanced:  strongest 3 qualified markets
 * Aggressive: strongest 5 qualified markets
 *
 * We never weaken the V3 qualification gate merely to fill a card.
 */
export function buildAIParlays(games = []) {
  const qualified = uniqueQualifiedLegs(games);

  return {
    qualifiedLegs: qualified.length,

    safer: buildParlayCard(
      "safer",
      "Safer AI Parlay",
      qualified.slice(0, 2),
      2
    ),

    balanced: buildParlayCard(
      "balanced",
      "Balanced AI Parlay",
      qualified.slice(0, 3),
      3
    ),

    aggressive: buildParlayCard(
      "aggressive",
      "Aggressive AI Parlay",
      qualified.slice(0, 5),
      4
    )
  };
}

/*
 * Backward-compatible export for anything already importing
 * buildAIParlay().
 */
export function buildAIParlay(games = []) {
  return buildAIParlays(games).balanced.legs;
}
