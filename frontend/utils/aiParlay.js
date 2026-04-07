import { calculateEV } from "./calculations";

// 🔥 Build AI parlay from best EV plays
export function buildAIParlay(games) {
  const picks = games.map((g) => {
    const evAway = Number(calculateEV(g.bestAway.odds));
    const evHome = Number(calculateEV(g.bestHome.odds));

    if (evAway > evHome) {
      return {
        team: g.away,
        odds: g.bestAway.odds,
        book: g.bestAway.book,
        ev: evAway
      };
    } else {
      return {
        team: g.home,
        odds: g.bestHome.odds,
        book: g.bestHome.book,
        ev: evHome
      };
    }
  });

  // 🔥 Sort by EV
  picks.sort((a, b) => b.ev - a.ev);

  // Take top 3
  return picks.slice(0, 3);
}
