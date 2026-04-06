export function impliedProbability(odds) {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return -odds / (-odds + 100);
  }
}

export function toDecimal(odds) {
  if (odds > 0) {
    return 1 + odds / 100;
  } else {
    return 1 + 100 / Math.abs(odds);
  }
}

export function calculateEV(odds, trueProb = 0.55) {
  const dec = toDecimal(odds);
  const ev = (trueProb * dec - 1) * 100;
  return ev.toFixed(2);
}

export function checkArbitrage(odds1, odds2) {
  const p1 = impliedProbability(odds1);
  const p2 = impliedProbability(odds2);

  const total = p1 + p2;

  if (total < 1) {
    return ((1 - total) * 100).toFixed(2);
  }

  return null;
}
