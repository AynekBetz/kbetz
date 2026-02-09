/********************************
 * STATE
 ********************************/
let token = localStorage.getItem("token");
let legs = [];
let betPercent = 2;

/********************************
 * HELPERS
 ********************************/
const el = (id) => document.getElementById(id);

/********************************
 * AUTH UI
 ********************************/
function setAuthUI(loggedIn) {
  document.querySelectorAll(".card").forEach((card) => {
    if (card.innerText.includes("Add Leg")) {
      card.style.display = loggedIn ? "block" : "none";
    }
  });
}
setAuthUI(!!token);

/********************************
 * AUTH
 ********************************/
async function register() {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: el("email").value,
      password: el("password").value,
    }),
  });
  alert(res.ok ? "Registered. Login now." : "Register failed");
}

async function login() {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: el("email").value,
      password: el("password").value,
    }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    setAuthUI(true);
    alert("Logged in");
  } else alert("Login failed");
}

/********************************
 * SLIP LOGIC
 ********************************/
function addLeg() {
  legs.push({
    game: el("game").value,
    odds: parseFloat(el("odds").value),
    prob: parseFloat(el("prob").value) / 100,
  });
  renderLegs();
}

function renderLegs() {
  el("legs").innerHTML = legs
    .map(
      (l, i) =>
        `<div>Leg ${i + 1}: ${l.game} | Odds ${l.odds} | Win ${(l.prob * 100).toFixed(
          1
        )}%</div>`
    )
    .join("");
}

/********************************
 * ODDS + KELLY MATH
 ********************************/
function decimalOdds(odds) {
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / -odds;
}

function kellyFraction(p, d) {
  return (p * d - 1) / (d - 1);
}

/********************************
 * SLIDER (LIVE WARNINGS)
 ********************************/
function updateBetSize(val) {
  betPercent = parseFloat(val);
  el("betSizeLabel").innerText = `${betPercent}%`;
  updateSliderWarning();
}

function updateSliderWarning() {
  if (legs.length === 0) {
    el("warnings").innerText = "";
    return;
  }

  const avgKelly =
    legs.reduce(
      (sum, l) => sum + kellyFraction(l.prob, decimalOdds(l.odds)),
      0
    ) / legs.length;

  let msg = "";
  let color = "";

  if (betPercent / 100 <= avgKelly * 0.5) {
    msg = "✅ Conservative sizing (low drawdown risk)";
    color = "#4ade80";
  } else if (betPercent / 100 <= avgKelly) {
    msg = "⚠️ Aggressive sizing (higher variance)";
    color = "#facc15";
  } else {
    msg = "🚨 DANGEROUS: Bet size exceeds Kelly. High ruin risk.";
    color = "#f87171";
  }

  el("warnings").innerText = msg;
  el("warnings").style.color = color;
}

/********************************
 * ANALYZE
 ********************************/
async function analyzeSlip() {
  if (!token) return alert("Login required");

  const bankroll = parseFloat(el("bankroll").value);
  let evProduct = 1;

  legs.forEach((l) => {
    evProduct *= l.prob * decimalOdds(l.odds);
  });

  const trueEV = evProduct - 1;

  const avgKelly =
    legs.reduce(
      (sum, l) => sum + kellyFraction(l.prob, decimalOdds(l.odds)),
      0
    ) / legs.length;

  let finalWarning = "";
  if (trueEV < 0) {
    finalWarning = "❌ Negative EV — long-term losing bet.";
  } else if (betPercent / 100 > avgKelly) {
    finalWarning = "🚨 Over-Kelly bet — bankroll at risk.";
  }

  el("results").innerHTML = `
    <div>EV: ${(trueEV * 100).toFixed(2)}%</div>
    <div>Kelly Suggestion: ${(avgKelly * 100).toFixed(2)}%</div>
    <div>Bet Amount: $${((betPercent / 100) * bankroll).toFixed(2)}</div>
  `;

  if (finalWarning) {
    el("warnings").innerText = finalWarning;
    el("warnings").style.color = "#f87171";
  }

  await fetch("/api/slips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ legs, bankroll, betPercent, trueEV }),
  });
}

/********************************
 * LOAD SLIPS
 ********************************/
async function loadSlips() {
  const res = await fetch("/api/slips", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  el("savedSlips").innerHTML = data
    .map(
      (s) =>
        `<div>${new Date(s.createdAt).toLocaleString()} — EV ${(
          s.data.trueEV * 100
        ).toFixed(2)}%</div>`
    )
    .join("");
}
