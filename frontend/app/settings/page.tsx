"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [bankroll, setBankroll] = useState(100);

  return (
    <div style={{ padding: "20px" }}>
      <h1>⚙️ Settings</h1>

      <div>
        <label>Bankroll: $ </label>
        <input
          type="number"
          value={bankroll}
          onChange={(e) => setBankroll(Number(e.target.value))}
          style={{
            background: "#111",
            color: "white",
            border: "1px solid #333",
            padding: "4px"
          }}
        />
      </div>
    </div>
  );
}