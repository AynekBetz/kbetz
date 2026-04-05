"use client";

import { useState } from "react";
import BetSlip from "./BetSlip";

export default function ParlayBuilder() {
  const [selectedSlip, setSelectedSlip] = useState<any[]>([]);

  // 🔥 ADD PICK (example — keep your existing logic if different)
  const addPick = (pick: any) => {
    setSelectedSlip(prev => [...prev, pick]);
  };

  // 🔥 REMOVE PICK (THIS FIXES YOUR ERROR)
  const removePick = (index: number) => {
    setSelectedSlip(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      display: "flex",
      gap: "20px",
      padding: "20px",
      background: "#020202",
      color: "white",
      minHeight: "100vh"
    }}>
      
      {/* LEFT SIDE */}
      <div style={{ flex: 2 }}>
        <h2>Available Picks</h2>

        {/* 🔥 Example picks (replace with your real data) */}
        <button onClick={() => addPick({ team: "Lakers ML", odds: -120 })}>
          Add Lakers ML (-120)
        </button>

        <button onClick={() => addPick({ team: "Celtics ML", odds: +110 })}>
          Add Celtics ML (+110)
        </button>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ flex: 1 }}>
        <h2>Bet Slip</h2>

        {/* ✅ FIXED — removePick passed */}
        <BetSlip 
          slip={selectedSlip} 
          removePick={removePick} 
        />
      </div>

    </div>
  );
}