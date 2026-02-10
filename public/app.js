let token = null;
let plan = "free";
let betPercent = 2;

/* ---------- HELPERS ---------- */
const el = (id) => document.getElementById(id);

function decimalOdds(o) {
  return o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o);
}

// ½-Kelly (industry standard)
function halfKelly(p, d) {
  return ((p * d - 1) / (d - 1)) * 0.5;
}

/* ---------- AUTH ---------- */
async function login() {
  const email = el("email").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  token = data.token;
  plan = data.plan;

  el("planStatus").innerText =
    plan === "pro"
      ? "💎 Pro account"
      : "🔒 Free account (Kelly locked)";

  if (plan !== "pro") {
    el("betSlider").disabled = true;
  }
}

/* ---------- SLIDER ---------- */
function updateBetSize(val) {
  betPercent = parseFloat(val);
  el("betSizeLabel").innerText = `${betPercent}%`;
}

/* ---------- ANALYSIS ---------- */
function analyze() {
  const odds = Number(el("odds").value);
  const prob = Number(el("prob").value) / 100;
  const bankroll = Number(el("bankroll").value);

  if (!odds || !prob || !bankroll) {
    alert("Fill all fields");
    return;
  }

  const d = decimalOdds(odds);
  const kelly = halfKelly(prob, d);
  const betAmt = (betPercent / 100) * bankroll;

  el("kellyInfo").innerHTML = `
    <strong>½-Kelly suggestion:</strong> ${(kelly * 100).toFixed(2)}%
  `;

  // Warnings
  let warning = "";
  if (betPercent / 100 > kelly && kelly > 0) {
    warning = "⚠️ Bet size exceeds ½-Kelly (high variance risk)";
  }
  if (kelly <= 0) {
    warning = "❌ Negative edge — Kelly suggests no bet";
  }

  el("warnings").innerText = warning;

  el("results").innerHTML = `
    Bet Amount: $${betAmt.toFixed(2)}
  `;
}
