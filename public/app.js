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
        `<div>Leg ${i + 1}: ${l.game} | Odds ${l.odds} | Win ${(l.prob * 100).toFixed(1)}%</div>`
    )
    .join("");
}

/********************************
 * KELLY + EV
 ********************************/
function impliedProb(odds) {
  return odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
}

function decimalOdds(odds) {
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / -odds;
}

function kellyFraction(p, d) {
  return (p * d - 1) / (d - 1);
}

function updateBetSize(val) {
  betPercent = parseFloat(val);
  el("betSizeLabel").innerText = `${betPercent}%`;
}

/********************************
 * ANALYZE
 ********************************/
async function analyzeSlip() {
  if (!token) return alert("Login required");

  const bankroll = parseFloat(el("bankroll").value);
  let ev = 1;

  legs.forEach((l) => {
    ev *= l.prob * decimalOdds(l.odds);
  });

  const trueEV = ev - 1;

  // Kelly suggestion (hidden helper)
  const avgKelly =
    legs.reduce((sum, l) => sum + kellyFraction(l.prob, decimalOdds(l.odds)), 0) /
    legs.length;

  // Warnings
  let warning = "";
  if (betPercent / 100 > avgKelly && avgKelly > 0) {
    warning = "⚠️ Bet size exceeds Kelly suggestion. Risk of overbetting.";
  }
  if (trueEV < 0) {
    warning = "❌ Negative EV — long-term losing bet.";
  }

  el("warnings").innerText = warning;
  el("results").innerHTML = `
    <div>EV: ${(trueEV * 100).toFixed(2)}%</div>
    <div>Kelly Suggestion: ${(avgKelly * 100).toFixed(2)}%</div>
    <div>Bet Amount: $${((betPercent / 100) * bankroll).toFixed(2)}</div>
  `;

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
        `<div>${new Date(s.createdAt).toLocaleString()} — EV ${(s.data.trueEV * 100).toFixed(2)}%</div>`
    )
    .join("");
}
