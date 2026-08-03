"use client";

import { useMemo, useState } from "react";

const SPORT_ICONS = {
  BASEBALL: "⚾",
  BASKETBALL: "🏀",
  SOCCER: "⚽",
  HOCKEY: "🏒",
  FOOTBALL: "🏈",
  NFL: "🏈",
  NBA: "🏀",
  WNBA: "🏀",
  MLB: "⚾",
  NHL: "🏒",
  MMA: "🥊",
  TENNIS: "🎾",
  GOLF: "⛳",
};

function cleanSport(game) {
  return String(game?.sport || game?.league || "SPORT")
    .trim()
    .toUpperCase();
}

function gameTimestamp(game) {
  const value = game?.commenceTime || game?.time;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatStartTime(game) {
  const value = game?.commenceTime || game?.time;

  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LiveMarkets({
  loading,
  games = [],
  hovered,
  setHovered,
  flash = {},
  formatOdds,
  addToParlay,
}) {
  const [activeSport, setActiveSport] = useState("ALL");

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const aOdds = a?.hasOdds ? 0 : 1;
      const bOdds = b?.hasOdds ? 0 : 1;

      if (aOdds !== bOdds) return aOdds - bOdds;

      return gameTimestamp(a) - gameTimestamp(b);
    });
  }, [games]);

  const sportCounts = useMemo(() => {
    return sortedGames.reduce((counts, game) => {
      const sport = cleanSport(game);
      counts[sport] = (counts[sport] || 0) + 1;
      return counts;
    }, {});
  }, [sortedGames]);

  const sports = Object.keys(sportCounts).sort(
    (a, b) => sportCounts[b] - sportCounts[a]
  );

  const filteredGames =
    activeSport === "ALL"
      ? sortedGames
      : sortedGames.filter((game) => cleanSport(game) === activeSport);

  const visibleGames = filteredGames.slice(0, 30);

  return (
    <section
      style={{
        border: "1px solid rgba(0,255,214,.24)",
        borderRadius: 22,
        padding: 20,
        background:
          "linear-gradient(145deg, rgba(3,18,22,.92), rgba(10,4,22,.9))",
        boxShadow:
          "0 0 34px rgba(0,255,214,.08), inset 0 0 24px rgba(209,45,255,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              letterSpacing: 1,
              color: "#ffffff",
            }}
          >
            LIVE SPORTS BOARD
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              color: "rgba(255,255,255,.64)",
              fontSize: 13,
            }}
          >
            Real schedules and sportsbook markets from connected providers
          </p>
        </div>

        <div
          style={{
            border: "1px solid rgba(0,255,214,.35)",
            borderRadius: 999,
            padding: "8px 12px",
            color: "#00ffd6",
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          {games.length} GAMES AVAILABLE
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSport("ALL")}
          style={{
            border:
              activeSport === "ALL"
                ? "1px solid #00ffd6"
                : "1px solid rgba(255,255,255,.13)",
            borderRadius: 999,
            padding: "9px 13px",
            background:
              activeSport === "ALL"
                ? "rgba(0,255,214,.14)"
                : "rgba(255,255,255,.035)",
            color: activeSport === "ALL" ? "#00ffd6" : "#ffffff",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          ALL {games.length}
        </button>

        {sports.map((sport) => (
          <button
            type="button"
            key={sport}
            onClick={() => setActiveSport(sport)}
            style={{
              border:
                activeSport === sport
                  ? "1px solid #d72dff"
                  : "1px solid rgba(255,255,255,.13)",
              borderRadius: 999,
              padding: "9px 13px",
              background:
                activeSport === sport
                  ? "rgba(215,45,255,.14)"
                  : "rgba(255,255,255,.035)",
              color: activeSport === sport ? "#f0b8ff" : "#ffffff",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            {SPORT_ICONS[sport] || "🏟️"} {sport} {sportCounts[sport]}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          style={{
            padding: 28,
            textAlign: "center",
            color: "rgba(255,255,255,.65)",
          }}
        >
          Loading current sports...
        </div>
      ) : visibleGames.length === 0 ? (
        <div
          style={{
            padding: 28,
            textAlign: "center",
            color: "rgba(255,255,255,.65)",
          }}
        >
          No current games are available for this sport.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
            gap: 14,
          }}
        >
          {visibleGames.map((game, index) => {
            const sport = cleanSport(game);
            const key = game.key || game.id || `${game.away}-${game.home}-${index}`;
            const hasOdds =
              game.hasOdds === true &&
              Number.isFinite(Number(game.homeOdds));

            return (
              <article
                key={key}
                onMouseEnter={() => setHovered?.(key)}
                onMouseLeave={() => setHovered?.(null)}
                style={{
                  border: hasOdds
                    ? "1px solid rgba(0,255,214,.34)"
                    : "1px solid rgba(209,45,255,.22)",
                  borderRadius: 17,
                  padding: 16,
                  background:
                    hovered === key
                      ? "linear-gradient(145deg, rgba(0,255,214,.09), rgba(209,45,255,.09))"
                      : "rgba(255,255,255,.028)",
                  boxShadow:
                    flash?.[key] || hovered === key
                      ? "0 0 24px rgba(0,255,214,.16)"
                      : "none",
                  transition: "all .18s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "flex-start",
                    marginBottom: 13,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#00ffd6",
                        fontWeight: 1000,
                        fontSize: 12,
                        letterSpacing: 1,
                      }}
                    >
                      {SPORT_ICONS[sport] || "🏟️"} {sport}
                    </div>

                    <div
                      style={{
                        color: "rgba(255,255,255,.56)",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {game.league || "Sports"}
                    </div>
                  </div>

                  <span
                    style={{
                      border: hasOdds
                        ? "1px solid rgba(0,255,136,.45)"
                        : "1px solid rgba(255,196,61,.38)",
                      borderRadius: 999,
                      padding: "5px 8px",
                      color: hasOdds ? "#00ff88" : "#ffd66b",
                      fontSize: 10,
                      fontWeight: 1000,
                    }}
                  >
                    {hasOdds ? "ODDS LIVE" : "SCHEDULE ONLY"}
                  </span>
                </div>

                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    lineHeight: 1.55,
                    fontWeight: 900,
                  }}
                >
                  <div>{game.away}</div>
                  <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>
                    at
                  </div>
                  <div>{game.home}</div>
                </div>

                <div
                  style={{
                    marginTop: 13,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "rgba(255,255,255,.53)",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 1,
                      }}
                    >
                      START
                    </div>

                    <div
                      style={{
                        color: "#ffffff",
                        marginTop: 3,
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {formatStartTime(game)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "rgba(255,255,255,.53)",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 1,
                      }}
                    >
                      PROVIDER
                    </div>

                    <div
                      style={{
                        color: "#f0b8ff",
                        marginTop: 3,
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {game.provider || "API-Sports"}
                    </div>
                  </div>
                </div>

                {hasOdds ? (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <strong style={{ color: "#00ffd6", fontSize: 17 }}>
                      {game.home} {formatOdds?.(game.homeOdds)}
                    </strong>

                    <button
                      type="button"
                      onClick={() => addToParlay?.(game)}
                      style={{
                        border: "1px solid rgba(0,255,214,.5)",
                        borderRadius: 10,
                        padding: "9px 11px",
                        background: "rgba(0,255,214,.1)",
                        color: "#00ffd6",
                        cursor: "pointer",
                        fontWeight: 1000,
                      }}
                    >
                      + Parlay
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 12,
                      color: "rgba(255,255,255,.55)",
                      fontSize: 12,
                    }}
                  >
                    Sportsbook prices will appear automatically when available.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {filteredGames.length > visibleGames.length ? (
        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            color: "rgba(255,255,255,.52)",
            fontSize: 12,
          }}
        >
          Showing 30 of {filteredGames.length} games. Use the sport filters to
          narrow the board.
        </div>
      ) : null}
    </section>
  );
}
