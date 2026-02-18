export function generateModelProbability(impliedProb) {
  const variance = (Math.random() * 0.06) - 0.03;
  let modelProb = impliedProb + variance;

  if (modelProb < 0.01) modelProb = 0.01;
  if (modelProb > 0.99) modelProb = 0.99;

  return modelProb;
}
