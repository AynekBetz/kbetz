"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const pageBg = [
  "linear-gradient(rgba(0,0,0,.32), rgba(0,0,0,.72))",
  "radial-gradient(circle at 18% 20%, rgba(0,255,214,.20), transparent 30%)",
  "radial-gradient(circle at 86% 18%, rgba(210,45,255,.28), transparent 30%)",
  "url('/kbetz-stadium-wallpaper.png') center top / cover fixed no-repeat",
].join(", ");

export default function HomePage() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : "";
    setHasToken(Boolean(token));
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 980,
          borderRadius: 28,
          border: "1px solid rgba(0,255,214,.42)",
          background:
            "linear-gradient(145deg, rgba(3,19,22,.76), rgba(12,3,24,.72))",
          boxShadow:
            "0 0 60px rgba(0,255,214,.20), 0 0 90px rgba(215,45,255,.14)",
          padding: "38px 26px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.18)",
            background: "rgba(0,0,0,.30)",
            color: "#8ffff0",
            fontWeight: 900,
            letterSpacing: 1.2,
            fontSize: 12,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: "#00ffd6",
              boxShadow: "0 0 14px #00ffd6",
              display: "inline-block",
            }}
          />
          LIVE SPORTS ANALYTICS TERMINAL
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(46px, 9vw, 92px)",
            lineHeight: 0.95,
            fontWeight: 1000,
            letterSpacing: 2,
            background:
              "linear-gradient(90deg, #00ffd6, #63eaff, #d72dff, #ff4fd8)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          KBETZ
        </h1>

        <p
          style={{
            margin: "14px auto 0",
            maxWidth: 760,
            color: "rgba(255,255,255,.84)",
            fontSize: "clamp(18px, 3vw, 28px)",
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          AI-powered picks, live odds, parlay tools, player stats, and a public
          record built for serious sports bettors.
        </p>

        <p
          style={{
            margin: "16px auto 0",
            maxWidth: 720,
            color: "rgba(255,255,255,.68)",
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          No bet is guaranteed. KBETZ helps you make sharper decisions with data,
          movement, confidence signals, and transparent tracking.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "center",
            marginTop: 30,
          }}
        >
          <Link
            href={hasToken ? "/dashboard" : "/signup"}
            style={{
              textDecoration: "none",
              color: "#001112",
              background: "linear-gradient(90deg, #00ffd6, #63eaff)",
              padding: "15px 22px",
              borderRadius: 999,
              fontWeight: 1000,
              boxShadow: "0 0 28px rgba(0,255,214,.35)",
              minWidth: 170,
            }}
          >
            {hasToken ? "ENTER DASHBOARD" : "START KBETZ"}
          </Link>

          <Link
            href="/login"
            style={{
              textDecoration: "none",
              color: "#fff",
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.22)",
              padding: "15px 22px",
              borderRadius: 999,
              fontWeight: 1000,
              minWidth: 150,
            }}
          >
            LOGIN
          </Link>

          <Link
            href="/record"
            style={{
              textDecoration: "none",
              color: "#fff",
              background: "rgba(215,45,255,.18)",
              border: "1px solid rgba(215,45,255,.40)",
              padding: "15px 22px",
              borderRadius: 999,
              fontWeight: 1000,
              minWidth: 170,
            }}
          >
            PUBLIC RECORD
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginTop: 30,
          }}
        >
          {["AI Top Picks", "Live Odds", "Parlay Builder", "Player Stats"].map(
            (item) => (
              <div
                key={item}
                style={{
                  border: "1px solid rgba(255,255,255,.14)",
                  background: "rgba(0,0,0,.26)",
                  borderRadius: 18,
                  padding: "14px 10px",
                  fontWeight: 950,
                  color: "rgba(255,255,255,.88)",
                }}
              >
                {item}
              </div>
            )
          )}
        </div>

        <p
          style={{
            marginTop: 24,
            marginBottom: 0,
            color: "rgba(255,255,255,.50)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          KBETZ is an independent sports analytics platform and is not affiliated
          with or endorsed by any league, team, sportsbook, or media company.
        </p>
      </section>
    </main>
  );
}
