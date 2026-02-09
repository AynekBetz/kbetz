// app.js — Phase A frontend logic

async function analyzeSlip() {
  const odds = Number(document.getElementById("odds").value);
  const probPct = Number(document.getElementById("prob").value);

  if (!odds || !probPct) {
    alert("Enter odds and win probability");
    return;
  }

  const userProb = probPct / 100;

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      odds,
      userProb,
      hedgeThreshold: 0.03, // 3% EV drop
    }),
  });

  const data = await res.json();

  const results = document.getElementById("results");
  results.innerHTML = `
    <p><strong>EV:</strong> ${data.ev}</p>
    <p><strong>Implied Prob:</strong> ${data.impliedProb}</p>
    <p style="color:${data.hedgeAlert ? "red" : "lime"}">
      ${data.message}
    </p>
  `;
}

// Optional: test live odds
async function testOdds() {
  const res = await fetch("/api/odds");
  const data = await res.json();
  console.log("Live odds sample:", data);
}
