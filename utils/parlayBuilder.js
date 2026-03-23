export function buildParlays(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const candidates = data.filter(
    (d) =>
      d.steam === true ||
      (d.ev && d.ev > 2) ||
      (d.movement && Math.abs(d.movement) > 10)
  );

  if (candidates.length === 0) return [];

  return [
    {
      type: "safe",
      confidence: 70,
      legs: candidates.slice(0, 2),
    },
    {
      type: "balanced",
      confidence: 55,
      legs: candidates.slice(0, 3),
    },
    {
      type: "aggressive",
      confidence: 40,
      legs: candidates.slice(0, 4),
    },
  ];
}