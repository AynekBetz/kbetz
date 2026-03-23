"use client";

function americanToDecimal(odds: number) {
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
}

function calculateParlayOdds(slip: any[]) {
  if (!slip || slip.length === 0) return 0;

  let total = 1;

  slip.forEach((leg) => {
    total *= americanToDecimal(leg.odds);
  });

  return total;
}

export default function BetSlip({
  slip,
  removePick,
}: {
  slip: any[];
  removePick: (index: number) => void;
}) {
  const totalOdds = calculateParlayOdds(slip);
  const stake = 100;

  const payout =
    totalOdds > 0 ? (stake * totalOdds).toFixed(2) : "0.00";

  return (
    <div className="betslip">
      <h2 className="betslip-title">Bet Slip</h2>

      {!slip || slip.length === 0 ? (
        <p className="muted">Click odds to add bets</p>
      ) : (
        <>
          {slip.map((leg, i) => (
            <div key={i} className="betslip-leg">
              <div>{leg.game}</div>
              <div>{leg.market}</div>
              <div>{leg.odds}</div>

              <button
                className="remove-btn"
                onClick={() => removePick(i)}
              >
                ✕
              </button>
            </div>
          ))}

          {/* 🔥 PARLAY INFO */}
          <div className="parlay-summary">
            <div>Total Odds: {totalOdds.toFixed(2)}x</div>
            <div>Stake: ${stake}</div>
            <div className="payout">
              Payout: ${payout}
            </div>
          </div>

          <button className="bet-button">
            Place Bet
          </button>
        </>
      )}
    </div>
  );
}