export function analyzeBetSlip(legs) {

  let totalOdds = 1;
  let fragileLeg = null;
  let lowestConfidence = 10;

  const analysis = [];

  for (const leg of legs) {

    const decimal =
      leg.odds > 0
        ? 1 + leg.odds / 100
        : 1 + 100 / Math.abs(leg.odds);

    totalOdds *= decimal;

    const impliedProb = 1 / decimal;

    const confidence =
      leg.confidence || Math.max(1, Math.round((1 - impliedProb) * 10));

    if (confidence < lowestConfidence) {
      lowestConfidence = confidence;
      fragileLeg = leg;
    }

    analysis.push({
      ...leg,
      impliedProbability: impliedProb,
      confidence
    });

  }

  return {
    legs: analysis,
    fragileLeg,
    parlayOdds: totalOdds,
    confidence: lowestConfidence
  };

}