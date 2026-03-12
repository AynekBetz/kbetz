let token = null;
let legs = [];

const el = id => document.getElementById(id);

// ---------- AUTH ----------
function register() {
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: el("email").value,
      password: el("password").value
    })
  }).then(r => r.json()).then(console.log);
}

function login() {
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: el("email").value,
      password: el("password").value
    })
  }).then(r => r.json()).then(d => {
    token = d.token;
    alert("Logged in");
  });
}

// ---------- SLIP ----------
function addLeg() {
  legs.push({
    game: el("game").value,
    odds: Number(el("odds").value),
    prob: Number(el("prob").value) / 100
  });

  el("legs").innerHTML = legs.map(l =>
    `${l.game} (${l.odds}, ${l.prob * 100}%)`
  ).join("<br>");
}

function analyze() {
  fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slip: legs })
  })
    .then(r => r.json())
    .then(d => {
      el("results").innerHTML = `EV: $${d.ev}`;

      fetch("/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ analysis: d })
      });
    });
}

// ---------- LEADERBOARD ----------
function loadLeaderboard() {
  fetch("/leaderboard")
    .then(r => r.json())
    .then(data => {
      el("leaderboard").innerHTML =
        data.length === 0
          ? "No data yet"
          : data.map(
              (x, i) => `${i + 1}. ${x.user} — EV: $${x.avgEV}`
            ).join("<br>");
    });
}
