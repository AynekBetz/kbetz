"use client";

import { useEffect, useState } from "react";
import { getToken } from "../../utils/authStore";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const [bets, setBets] = useState<any[]>([]);
  const [profitHistory, setProfitHistory] = useState<number[]>([]);

  const token = getToken();

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:10000/bets", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => {
        setBets(data);

        let profit = 0;
        const history: number[] = [];

        data.forEach((b: any) => {
          if (b.result === "win") {
            profit += b.odds > 0
              ? b.odds / 100
              : 100 / Math.abs(b.odds);
          } else if (b.result === "loss") {
            profit -= 1;
          }

          history.push(Number(profit.toFixed(2)));
        });

        setProfitHistory(history);
      });
  }, [token]);

  const wins = bets.filter((b) => b.result === "win").length;
  const losses = bets.filter((b) => b.result === "loss").length;
  const total = wins + losses;

  const profit = profitHistory[profitHistory.length - 1] || 0;

  const roi =
    total > 0
      ? ((profit / total) * 100).toFixed(1)
      : 0;

  const data = {
    labels: bets.map((_, i) => `Bet ${i + 1}`),
    datasets: [
      {
        label: "Bankroll Growth",
        data: profitHistory,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div style={{
      padding: "20px",
      background: "black",
      color: "white",
      minHeight: "100vh"
    }}>

      <h1>📊 KBETZ Analytics</h1>

      {/* 🔥 SUMMARY */}
      <div style={{
        display: "flex",
        gap: "20px",
        marginBottom: "20px"
      }}>
        <div>Wins: {wins}</div>
        <div>Losses: {losses}</div>
        <div>Profit: {profit.toFixed(2)}</div>
        <div>ROI: {roi}%</div>
      </div>

      {/* 🔥 CHART */}
      <div style={{
        background: "#111",
        padding: "15px",
        border: "1px solid #222"
      }}>
        <Line data={data} />
      </div>

    </div>
  );
}