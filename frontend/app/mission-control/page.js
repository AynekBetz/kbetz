"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MissionHeader from "./components/MissionHeader";
import SystemHealth from "./components/SystemHealth";
import LivePlatform from "./components/LivePlatform";
import IntelligenceCenter from "./components/IntelligenceCenter";

const API = "https://kbetz-live.onrender.com";
const REFRESH_MS = 60000;

function getDataAge(timestamp) {
  if (!timestamp) return "--";

  const ageSeconds = Math.max(
    0,
    Math.floor((Date.now() - Number(timestamp)) / 1000)
  );

  if (ageSeconds < 60) {
    return `${ageSeconds}s ago`;
  }

  const ageMinutes = Math.floor(ageSeconds / 60);

  if (ageMinutes < 60) {
    return `${ageMinutes}m ago`;
  }

  return `${Math.floor(ageMinutes / 60)}h ago`;
}

function getSportName(game) {
  return String(game?.sport || game?.league || "SPORT")
    .trim()
    .toUpperCase();
}

export default function MissionControl() {
  const [currentTime, setCurrentTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState(null);
  const [oddsPayload, setOddsPayload] = useState(null);
  const [error, setError] = useState("");
  const [ownerChecking, setOwnerChecking] = useState(true);
  const [ownerAllowed, setOwnerAllowed] = useState(false);
  const [ownerMetrics, setOwnerMetrics] = useState(null);

  const loadPlatform = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [healthResult, oddsResult] = await Promise.allSettled([
        fetch(`${API}/api/health`, {
          cache: "no-store",
        }).then(async (response) => {
          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                `Health request failed with ${response.status}`
            );
          }

          return data;
        }),

        fetch(`${API}/api/odds`, {
          cache: "no-store",
        }).then(async (response) => {
          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                `Odds request failed with ${response.status}`
            );
          }

          return data;
        }),
      ]);

      const nextHealth =
        healthResult.status === "fulfilled"
          ? healthResult.value
          : null;

      const nextOdds =
        oddsResult.status === "fulfilled"
          ? oddsResult.value
          : null;

      setHealth(nextHealth);
      setOddsPayload(nextOdds);

      if (!nextHealth && !nextOdds) {
        throw new Error("KBETZ backend did not answer either health request.");
      }
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Mission Control could not refresh the platform."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("token") || "";

    if (!token) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;

    async function verifyOwner() {
      try {
        const response = await fetch(`${API}/api/owner/dashboard`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (cancelled) return;

        if (response.status === 401) {
          window.localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        if (response.status === 403) {
          window.location.href = "/dashboard";
          return;
        }

        if (!response.ok) {
          throw new Error(`Owner check failed with ${response.status}`);
        }

        const data = await response.json().catch(() => ({}));

        setOwnerMetrics(
          data?.metrics && typeof data.metrics === "object"
            ? data.metrics
            : null
        );

        setOwnerAllowed(true);
      } catch (ownerError) {
        console.error("Mission Control owner verification failed:", ownerError);

        if (!cancelled) {
          setError("Mission Control could not verify owner access.");
        }
      } finally {
        if (!cancelled) {
          setOwnerChecking(false);
        }
      }
    }

    verifyOwner();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrentTime(new Date());

    const clockTimer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    if (!ownerAllowed) return;

    loadPlatform(false);

    const refreshTimer = window.setInterval(() => {
      loadPlatform(false);
    }, REFRESH_MS);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadPlatform, ownerAllowed]);

  const games = useMemo(() => {
    return Array.isArray(oddsPayload?.games)
      ? oddsPayload.games
      : [];
  }, [oddsPayload]);

  const sportsActive = useMemo(() => {
    return new Set(
      games
        .map((game) => getSportName(game))
        .filter(Boolean)
    ).size;
  }, [games]);

  const oddsReady = useMemo(() => {
    return games.filter(
      (game) =>
        game?.hasOdds === true &&
        (
          Number.isFinite(Number(game?.homeOdds)) ||
          Number.isFinite(Number(game?.awayOdds))
        )
    ).length;
  }, [games]);

  const aiPicksReady = useMemo(() => {
    return games.filter(
      (game) =>
        game?.hasOdds === true &&
        Number.isFinite(Number(game?.homeOdds)) &&
        Number.isFinite(Number(game?.edge)) &&
        Number(game?.confidence || 0) > 0
    ).length;
  }, [games]);

  const source = String(oddsPayload?.source || "");

  const apiSportsOnline =
    source === "api-sports" ||
    games.some((game) => game?.source === "api-sports");

  const oddsProviderOnline =
    source === "live" ||
    games.some((game) => game?.source === "live");

  const backendOnline = Boolean(health || oddsPayload);

  const mongoOnline =
    health?.mongo === true ||
    health?.mongodb === true ||
    health?.mongoConnected === true ||
    String(health?.database || "")
      .toLowerCase()
      .includes("connect");

  const provider = apiSportsOnline
    ? "API-Sports"
    : oddsProviderOnline
      ? "The Odds API"
      : games.length > 0
        ? "Connected Provider"
        : "Waiting";

  if (ownerChecking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          background:
            "radial-gradient(circle at 10% 0%, rgba(0,255,225,.13), transparent 28%), radial-gradient(circle at 90% 0%, rgba(181,45,255,.21), transparent 33%), linear-gradient(180deg,#020506,#030308)",
        }}
      >
        <div
          style={{
            padding: 22,
            borderRadius: 18,
            border: "1px solid rgba(0,255,225,.28)",
            background: "rgba(3,8,14,.82)",
            boxShadow:
              "0 0 30px rgba(0,255,225,.12), 0 0 40px rgba(124,58,237,.10)",
            fontWeight: 900,
          }}
        >
          Verifying owner access...
        </div>
      </main>
    );
  }

  if (!ownerAllowed) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(14px, 3vw, 34px)",
        color: "#ffffff",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        background:
          "radial-gradient(circle at 10% 0%, rgba(0,255,225,.13), transparent 28%), radial-gradient(circle at 90% 0%, rgba(181,45,255,.21), transparent 33%), radial-gradient(circle at 50% 100%, rgba(61,90,255,.08), transparent 40%), linear-gradient(180deg,#020506,#030308)",
      }}
    >
      <div
        style={{
          marginBottom: 18,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <a
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 15px",
            borderRadius: 999,
            border: "1px solid rgba(0,255,225,.45)",
            background:
              "linear-gradient(90deg, rgba(0,255,225,.12), rgba(53,215,255,.10), rgba(124,58,237,.14))",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 900,
            boxShadow:
              "0 0 18px rgba(0,255,225,.12), 0 0 18px rgba(124,58,237,.10)",
          }}
        >
          ← Back to Dashboard
        </a>
      </div>

      <MissionHeader
        currentTime={currentTime}
        refreshing={refreshing}
        platformOnline={backendOnline}
        onRefresh={() => loadPlatform(true)}
      />

      {error ? (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 13,
            border: "1px solid rgba(255,95,115,.38)",
            background: "rgba(255,95,115,.07)",
            color: "#ff8d9b",
            fontSize: 13,
          }}
        >
          Platform warning: {error}
        </div>
      ) : null}

      <SystemHealth
        frontendOnline={true}
        backendOnline={backendOnline}
        mongoOnline={mongoOnline}
        stripeOnline={backendOnline}
        apiSportsOnline={apiSportsOnline}
        oddsProviderOnline={oddsProviderOnline}
      />

      <LivePlatform
        loading={loading}
        gamesMonitored={games.length}
        sportsActive={sportsActive}
        oddsReady={oddsReady}
        aiPicksReady={aiPicksReady}
        provider={provider}
        lastRefresh={getDataAge(oddsPayload?.updatedAt)}
      />

      <IntelligenceCenter
        loading={loading}
        gamesMonitored={games.length}
        oddsReady={oddsReady}
        aiPicksReady={aiPicksReady}
        steamAlerts={0}
        arbitrageReady={0}
      />


      <section
        style={{
          marginTop: 22,
          border: "1px solid rgba(0,255,225,.22)",
          borderRadius: 18,
          padding: 18,
          background:
            "linear-gradient(135deg, rgba(0,255,225,.04), rgba(124,58,237,.07))",
          boxShadow:
            "0 0 28px rgba(0,255,225,.08), 0 0 34px rgba(124,58,237,.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.5,
                color: "#00ffe1",
              }}
            >
              OWNER BUSINESS COMMAND CENTER
            </div>

            <h2
              style={{
                margin: "6px 0 0",
                fontSize: 24,
                color: "#ffffff",
              }}
            >
              Business Metrics
            </h2>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(0,255,153,.35)",
              background: "rgba(0,255,153,.07)",
              color: "#00ff99",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            REAL OWNER DATA
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(min(100%,180px),1fr))",
            gap: 12,
          }}
        >
          {[
            [
              "Total Users",
              ownerMetrics?.totalUsers ?? "--",
              "All registered KBETZ accounts",
            ],
            [
              "PRO Members",
              ownerMetrics?.proMembers ?? "--",
              "Accounts currently marked PRO",
            ],
            [
              "Free Members",
              ownerMetrics?.freeMembers ?? "--",
              "Registered non-PRO accounts",
            ],
            [
              "Conversion Rate",
              Number.isFinite(Number(ownerMetrics?.conversionRate))
                ? `${ownerMetrics.conversionRate}%`
                : "--",
              "PRO members ÷ total users",
            ],
            [
              "Revenue Today",
              ownerMetrics?.revenueToday == null
                ? "Not connected"
                : `$${Number(ownerMetrics.revenueToday).toFixed(2)}`,
              "Net successful Stripe revenue",
            ],
            [
              "Monthly Revenue",
              ownerMetrics?.monthlyRevenue == null
                ? "Not connected"
                : `$${Number(ownerMetrics.monthlyRevenue).toFixed(2)}`,
              "Net successful Stripe revenue",
            ],
            [
              "Lifetime Revenue",
              ownerMetrics?.lifetimeRevenue == null
                ? "--"
                : `$${Number(ownerMetrics.lifetimeRevenue).toFixed(2)}`,
              "Net successful Stripe revenue",
            ],
            [
              "MRR",
              ownerMetrics?.mrr == null
                ? "--"
                : `$${Number(ownerMetrics.mrr).toFixed(2)}`,
              "Active monthly-equivalent subscription revenue",
            ],
            [
              "Active Subscriptions",
              ownerMetrics?.activeSubscriptions ?? "--",
              "Stripe subscriptions currently active",
            ],
            [
              "Trials",
              ownerMetrics?.trialSubscriptions ?? "--",
              "Stripe subscriptions currently trialing",
            ],
            [
              "Live Now",
              ownerMetrics?.liveNow ?? "--",
              "Currently connected KBETZ dashboard sessions",
            ],
          ].map(([label, value, note]) => (
            <div
              key={label}
              style={{
                minHeight: 116,
                borderRadius: 15,
                border: "1px solid rgba(255,255,255,.08)",
                padding: 14,
                background: "rgba(255,255,255,.025)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1,
                  color: "rgba(255,255,255,.52)",
                }}
              >
                {label}
              </div>

              <div
                style={{
                  marginTop: 9,
                  fontSize: 24,
                  fontWeight: 1000,
                  color:
                    value === "Not connected" || value === "Pending"
                      ? "#ffb347"
                      : "#ffffff",
                }}
              >
                {value}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  lineHeight: 1.45,
                  color: "rgba(255,255,255,.42)",
                }}
              >
                {note}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          marginTop: 22,
          padding: "12px 4px 4px",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          color: "rgba(255,255,255,.4)",
          fontSize: 10,
          letterSpacing: 0.7,
        }}
      >
        <span>KBETZ MISSION CONTROL · REAL DATA ONLY</span>
        <span>AUTOMATIC REFRESH: 60 SECONDS</span>
      </footer>
    </main>
  );
}
