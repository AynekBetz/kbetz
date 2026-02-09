let token = localStorage.getItem("token");
let legs = [];
let betPercent = 2;
let lastSlipId = null;

const el = (id) => document.getElementById(id);

/* =======================
   AUTH
======================= */
async function register() {
  await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: el("email").value, password: el("password").value }),
  });
  alert("Registered — login now");
}

async function login() {
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: el("email").value, password: el("password").value }),
  });
  const d = await r.json();
  if (d.token) {
    token = d.token;
    localStorage.setItem("token", token);
    alert("Logged in");
  }
}

/* =======================
   SLIPS
======================= */
function addLeg() {
  legs.push({
    game: el("game").value,
    odds: parseFloat(el("odds").value),
    prob: parseFloat(el("prob").value) / 100,
  });
  el("legs").innerHTML = legs.map(
    (l, i) => `Leg ${i + 1}: ${l.game} @ ${l.odds}`
  ).join("<br>");
}

/* =======================
   KELLY + EV
======================= */
function decimal(o) {
  return o > 0 ? 1 + o / 100 : 1 + 100 / -o;
}

function kelly(p, d) {
  return (p * d - 1) / (d - 1);
}

function updateBetSize(v) {
  betPercent = parseFloat(v);
  el("betSizeLabel").innerText = `${betPercent}%`;
}

/* =======================
   ANALYZE
======================= */
async function analyzeSlip() {
  const bankroll = parseFloat(el("bankroll").value);
  let ev = 1;
  let avgKelly = 0;

  legs.forEach((l) => {
    ev *= l.prob * decimal(l.odds);
    avgKelly += kelly(l.prob, decimal(l.odds));
  });

  avgKelly /= legs.length;
  const trueEV = ev - 1;

  el("warnings").innerText =
    betPercent / 100 > avgKelly
      ? "🚨 Over Kelly — high risk"
      : "✅ Within Kelly";

  el("results").innerHTML = `
    EV ${(trueEV * 100).toFixed(2)}%<br>
    Kelly ${(avgKelly * 100).toFixed(2)}%<br>
    Bet $${((betPercent / 100) * bankroll).toFixed(2)}
  `;

  const res = await fetch("/api/slips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ legs, bankroll, betPercent, trueEV }),
  });

  const data = await res.json();
  lastSlipId = data.id;
}

/* =======================
   LOAD SLIPS
======================= */
async function loadSlips() {
  const r = await fetch("/api/slips", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const s = await r.json();
  el("savedSlips").innerHTML = s.map(
    (x) => `${new Date(x.createdAt).toLocaleString()}`
  ).join("<br>");
}
