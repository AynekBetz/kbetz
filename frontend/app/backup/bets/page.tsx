"use client";

import { useEffect, useState } from "react";
import { getToken } from "../../utils/authStore";

export default function BetsPage() {
  const [bets, setBets] = useState<any[]>([]);
  const token = getToken();

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:10000/bets", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => setBets(data));
  }, [token]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📜 Bet History</h1>

      {bets.map((b, i) => (
        <div key={i} style={{
          background: "#111",
          padding: "10px",
          marginBottom: "8px",
          border: "1px solid #222"
        }}>
          {b.team} ({b.odds}) — {b.result || "Pending"}
        </div>
      ))}
    </div>
  );
}