"use client";

function normalizeResult(value) {
  const result = String(value || "pending").toLowerCase();

  if (["win", "loss", "push", "pending"].includes(result)) {
    return result;
  }

  return "pending";
}

function selectedOdds(pick) {
  const recommended = String(
    pick?.recommended || pick?.bestLine || ""
  );

  const home = String(pick?.home || "");
  const away = String(pick?.away || "");

  if (recommended.includes(home)) {
    return Number(pick?.homeOdds || 0);
  }

  if (recommended.includes(away)) {
    return Number(pick?.awayOdds || 0);
  }

  return Number(pick?.homeOdds || pick?.awayOdds || 0);
}

function formatOdds(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number === 0) {
    return "--";
  }

  return number > 0 ? `+${number}` : `${number}`;
}

function formatGameDate(value) {
  if (!value) return "DATE TBD";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "DATE TBD";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatGameTime(value) {
  if (!value) return "TIME TBD";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "TIME TBD";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function resultColor(result) {
  if (result === "win") return "#20ff7a";
  if (result === "loss") return "#ff6565";
  if (result === "push") return "#ffd966";
  return "#7df9ff";
}

export default function HistoryPanel({
  styles,
  history = [],
  handleViewHistory,
  isPro,
  upgrade,
}) {
  if (!isPro) {
    return (
      <section
        style={{
          ...styles.historyWide,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={styles.iconPurple}>🔒</div>

        <div>
          <h2 style={styles.featureTitle}>KBETZ TRACKER PRO</h2>
          <p style={styles.featureSubtitle}>
            Track verified AI picks, results, final scores, and performance.
          </p>
        </div>

        <div style={styles.historyStat}>
          <span>RESULTS</span>
          <strong>LOCKED</strong>
          <em>PRO</em>
        </div>

        <div style={styles.historyStat}>
          <span>PROFIT</span>
          <strong>LOCKED</strong>
          <em>PRO</em>
        </div>

        <div style={styles.historyStat}>
          <span>RECORD</span>
          <strong>LOCKED</strong>
          <em>PRO</em>
        </div>

        <button style={styles.historyBtn} onClick={upgrade}>
          Upgrade to PRO
        </button>

        <div style={styles.rightBadgePurple}>PRO</div>
      </section>
    );
  }

  const picks = Array.isArray(history) ? history : [];

  const wins = picks.filter(
    (pick) => normalizeResult(pick?.result) === "win"
  );

  const losses = picks.filter(
    (pick) => normalizeResult(pick?.result) === "loss"
  );

  const pushes = picks.filter(
    (pick) => normalizeResult(pick?.result) === "push"
  );

  const pending = picks.filter(
    (pick) => normalizeResult(pick?.result) === "pending"
  );

  const completed = wins.length + losses.length + pushes.length;

  const units = picks.reduce((sum, pick) => {
    const result = normalizeResult(pick?.result);

    if (result === "pending") return sum;

    const profit = Number(pick?.profit || 0);

    return Number.isFinite(profit)
      ? sum + profit
      : sum;
  }, 0);

  const winRate =
    wins.length + losses.length > 0
      ? (
          (wins.length /
            (wins.length + losses.length)) *
          100
        ).toFixed(1)
      : "0.0";

  const recent = picks.slice(0, 8);

  return (
    <section
      style={{
        ...styles.historyWide,
        display: "block",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={styles.iconPurple}>◎</div>

          <div>
            <h2 style={styles.featureTitle}>
              KBETZ AI TRACKER
            </h2>

            <p style={styles.featureSubtitle}>
              Saved AI picks and verified game results
            </p>
          </div>
        </div>

        <div
          style={{
            border:
              "1px solid rgba(196,45,255,.28)",
            borderRadius: 999,
            padding: "7px 11px",
            color: "#f0b8ff",
            fontSize: 10,
            fontWeight: 1000,
          }}
        >
          {picks.length} PICKS TRACKED
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(120px,1fr))",
          gap: 10,
          marginTop: 18,
        }}
      >
        {[
          ["RECORD", `${wins.length}-${losses.length}`],
          ["WIN RATE", `${winRate}%`],
          [
            "UNITS",
            `${units >= 0 ? "+" : ""}${units.toFixed(2)}u`,
          ],
          ["PENDING", pending.length],
          ["PUSHES", pushes.length],
          ["GRADED", completed],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: 12,
              borderRadius: 13,
              border:
                "1px solid rgba(255,255,255,.08)",
              background:
                "rgba(255,255,255,.025)",
            }}
          >
            <div
              style={{
                color:
                  "rgba(255,255,255,.46)",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              {label}
            </div>

            <strong
              style={{
                display: "block",
                marginTop: 4,
                color: "#fff",
                fontSize: 18,
              }}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 9,
        }}
      >
        {recent.length ? (
          recent.map((pick, index) => {
            const result = normalizeResult(
              pick?.result
            );

            const profit = Number(
              pick?.profit || 0
            );

            return (
              <div
                key={
                  pick?._id ||
                  pick?.pickKey ||
                  index
                }
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(190px,1.6fr) minmax(150px,1fr) auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border:
                    "1px solid rgba(255,255,255,.07)",
                  background:
                    "linear-gradient(145deg,rgba(0,255,225,.025),rgba(196,45,255,.025))",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: 12,
                    }}
                  >
                    {pick?.away || "Away"} @{" "}
                    {pick?.home || "Home"}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color:
                        "rgba(255,255,255,.51)",
                      fontSize: 10,
                    }}
                  >
                    {formatGameDate(
                      pick?.commenceTime
                    )}{" "}
                    •{" "}
                    {formatGameTime(
                      pick?.commenceTime
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#7df9ff",
                      fontSize: 10,
                    }}
                  >
                    {pick?.recommended ||
                      pick?.bestLine ||
                      "Selection"}{" "}
                    {formatOdds(
                      selectedOdds(pick)
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 10,
                    lineHeight: 1.7,
                  }}
                >
                  <div
                    style={{
                      color:
                        "rgba(255,255,255,.58)",
                    }}
                  >
                    Confidence:{" "}
                    {Number(
                      pick?.confidence || 0
                    ).toFixed(0)}
                    %
                  </div>

                  <div
                    style={{
                      color:
                        "rgba(255,255,255,.58)",
                    }}
                  >
                    Edge:{" "}
                    {Number(
                      pick?.edge || 0
                    ).toFixed(1)}
                    %
                  </div>

                  {pick?.finalScore ? (
                    <div
                      style={{
                        color:
                          "rgba(255,255,255,.72)",
                      }}
                    >
                      {pick.finalScore}
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      border: `1px solid ${resultColor(
                        result
                      )}55`,
                      borderRadius: 999,
                      padding: "5px 9px",
                      color:
                        resultColor(result),
                      fontSize: 9,
                      fontWeight: 1000,
                      letterSpacing: 0.7,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    {result}
                  </div>

                  {result !== "pending" ? (
                    <div
                      style={{
                        marginTop: 6,
                        color:
                          profit > 0
                            ? "#20ff7a"
                            : profit < 0
                              ? "#ff6565"
                              : "#ffd966",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {profit > 0 ? "+" : ""}
                      {profit.toFixed(2)}u
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              border:
                "1px solid rgba(255,255,255,.07)",
              color:
                "rgba(255,255,255,.52)",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            No saved KBETZ AI picks yet.
          </div>
        )}
      </div>

      <button
        type="button"
        style={{
          ...styles.historyBtn,
          marginTop: 14,
        }}
        onClick={handleViewHistory}
      >
        Tracker Overview
      </button>
    </section>
  );
}
