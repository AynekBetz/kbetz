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
    setCurrentTime(new Date());

    const clockTimer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    loadPlatform(false);

    const refreshTimer = window.setInterval(() => {
      loadPlatform(false);
    }, REFRESH_MS);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadPlatform]);

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
