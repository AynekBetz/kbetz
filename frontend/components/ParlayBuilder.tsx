"use client";

import { useEffect, useState } from "react";
import BetSlip from "./BetSlip";

export default function ParlayBuilder() {
  const [parlays, setParlays] = useState<any[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<any[]>([]);

  const getEVColor = (ev: number) => {
    if (ev >= 5) return "ev-high";
    if (ev > 0) return "ev-medium";
    return "ev-low";
  };

  useEffect(() => {
    const fetchParlays = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/parlays`
        );
        const data = await res.json();

        setParlays(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load parlays", err);
        setParlays([]);
      }
    };

    fetchParlays();

    const interval = setInterval(fetchParlays, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="parlay-layout">
      
      {/* LEFT SIDE */}
      <div className="parlay-left">
        <div className="glass-panel">
          <h2 className="panel-title">🧠 AI Parlay Builder</h2>

          {parlays.length === 0 && (
            <p className="muted">No parlays available</p>
          )}

          <div className="parlay-grid">
            {parlays.map((p, i) => (
              <div
                key={i}
                className="parlay-card"
                onClick={() => setSelectedSlip(p.legs || [])}
              >
                <div className={`parlay-type ${p.type}`}>
                  {p.type} ({p.confidence}%)
                </div>

                {Array.isArray(p.legs) &&
                  p.legs.map((leg: any, j: number) => (
                    <div
                      key={j}
                      className={`parlay-leg ${getEVColor(leg.ev || 0)}`}
                    >
                      {leg.game} | {leg.market} ({leg.odds})
                      <span className="ev-tag">
                        {leg.ev ? `+${leg.ev}% EV` : "No edge"}
                      </span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="parlay-right">
        <BetSlip slip={selectedSlip} />
      </div>

    </div>
  );
}