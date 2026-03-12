const sportSelect = document.getElementById("sportSelect");
const sportStatus = document.getElementById("sportStatus");
const resultsDiv = document.getElementById("results");

let currentSport = null;

// ==============================
// LOAD SPORTS ON START
// ==============================
window.addEventListener("load", loadSports);

// ==============================
// LOAD SPORTS
// ==============================
async function loadSports() {
  sportStatus.innerText = "Loading sports...";

  try {
    const res = await fetch("/api/sports");
    const sports = await res.json();

    if (!Array.isArray(sports) || sports.length === 0) {
      sportStatus.innerText = "No sports currently in season.";
      return;
    }

    sportSelect.innerHTML = "";

    sports.forEach(sport => {
      const option = document.createElement("option");
      option.value = sport.key;
      option.textContent = sport.title;
      sportSelect.appendChild(option);
    });

    currentSport = sports[0].key;
    sportSelect.value = currentSport;

    sportStatus.innerText = "";
    loadOdds(currentSport);

  } catch (err) {
    sportStatus.innerText = "Failed to load sports.";
  }
}

// ==============================
// SPORT CHANGE
// ==============================
sportSelect.addEventListener("change", () => {
  currentSport = sportSelect.value;
  loadOdds(currentSport);
});

// ==============================
// LOAD ODDS
// ==============================
async function loadOdds(sportKey) {
  resultsDiv.innerHTML = "Loading games...";

  try {
    const res = await fetch(`/api/odds?sport=${sportKey}`);
    const games = await res.json();

    if (!Array.isArray(games) || games.length === 0) {
      resultsDiv.innerHTML = `
        <div class="empty-message">
          No live games right now.
        </div>
      `;
      return;
    }

    renderGames(games);

  } catch (err) {
    resultsDiv.innerHTML = "Failed to load odds.";
  }
}

// ==============================
// RENDER GAMES
// ==============================
function renderGames(games) {
  resultsDiv.innerHTML = "";

  games.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    const home = game.home_team;
    const away = game.away_team;

    const odds =
      game.bookmakers?.[0]?.markets?.[0]?.outcomes
        ?.map(o => `${o.name}: ${o.price}`)
        .join(" | ") || "No odds available";

    card.innerHTML = `
      <strong>${away}</strong> @ <strong>${home}</strong>
      <br>
      ${odds}
    `;

    resultsDiv.appendChild(card);
  });
}
