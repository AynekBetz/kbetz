/********************************
 * GLOBAL STATE
 ********************************/
let token = localStorage.getItem("token");
let legs = [];

/********************************
 * ELEMENT HELPERS
 ********************************/
const el = (id) => document.getElementById(id);

function emailEl() {
  return el("email");
}
function passwordEl() {
  return el("password");
}

/********************************
 * AUTH UI CONTROL
 ********************************/
function setAuthUI(loggedIn) {
  document.querySelectorAll(".card").forEach((card) => {
    if (
      card.innerText.includes("Add Leg") ||
      card.innerText.includes("Analyze")
    ) {
      card.style.display = loggedIn ? "block" : "none";
    }
  });
}

setAuthUI(!!token);

/********************************
 * AUTH FUNCTIONS
 ********************************/
async function register() {
  const email = emailEl().value;
  const password = passwordEl().value;

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) {
    alert("Registered successfully. Please log in.");
  } else {
    alert("Registration failed.");
  }
}

async function login() {
  const email = emailEl().value;
  const password = passwordEl().value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.token) {
    token = data.token;
    localStorage.setItem("token", token);
    setAuthUI(true);
    alert("Logged in successfully.");
  } else {
    alert("Invalid login.");
  }
}

/********************************
 * SLIP LOGIC
 ********************************/
function addLeg() {
  const game = el("game").value;
  const odds = el("odds").value;
  const prob = el("prob").value;

  if (!game || !odds || !prob) return alert("Fill all fields");

  legs.push({ game, odds, prob });
  renderLegs();
}

function renderLegs() {
  el("legs").innerHTML = legs
    .map(
      (l, i) =>
        `<div>Leg ${i + 1}: ${l.game} | Odds: ${l.odds} | Win%: ${l.prob}</div>`
    )
    .join("");
}

async function analyzeSlip() {
  if (!token) return alert("Login required.");

  const bankroll = el("bankroll").value || 0;

  const payload = { legs, bankroll };

  await fetch("/api/slips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  el("results").innerText = "Slip saved & analyzed.";
}

/********************************
 * SAVED SLIPS
 ********************************/
async function loadSlips() {
  if (!token) return alert("Login required.");

  const res = await fetch("/api/slips", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const slips = await res.json();

  el("savedSlips").innerHTML = slips
    .map(
      (s) =>
        `<div>Slip ${new Date(
          s.createdAt
        ).toLocaleString()} — ${s.data.legs.length} legs</div>`
    )
    .join("");
}

/********************************
 * LEADERBOARD
 ********************************/
async function loadLeaderboard() {
  const res = await fetch("/api/leaderboard");
  const data = await res.json();

  el("leaderboard").innerHTML = Object.entries(data)
    .map(([user, count]) => `<div>User ${user}: ${count} slips</div>`)
    .join("");
}

/********************************
 * SHARE LINK
 ********************************/
function shareSlip() {
  const encoded = btoa(JSON.stringify(legs));
  const link = `${window.location.origin}?slip=${encoded}`;
  el("shareLink").innerText = link;
}
