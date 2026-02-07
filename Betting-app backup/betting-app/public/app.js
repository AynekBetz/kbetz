// KBetz™ Frontend Logic

let legs = [];

// Add a leg from inputs
function addLeg() {
  const game = document.getElementById("game").value;
  const market = document.getElementById("market").value;
  const selection = document.getElementById("selection").value;
  const odds = document.getElementById("odds").value;
  const category = document.getElementById("category").value;

  if (!game || !selection || !odds) {
    alert("Please fill out game, selection, and odds");
    return;
  }

  const leg = { game, market, selection, odds, category };
  legs.push(leg);

  renderLegs();

  // clear inputs
  document.getElementById("game").value = "";
  document.getElementById("market").value = "";
  document.getElementById("selection").value = "";
  document.getElementById("odds").value = "";
  document.getElementById("category").value = "";
}

// Show legs on screen
function renderLegs() {
  const container = document.getElementById("legs");
  container.innerHTML = "";

  legs.forEach((leg, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${leg.game} | ${leg.selection} (${leg.odds})`;
    container.appendChild(div);
  });
}

// Analyze slip
function analyzeSlip() {
  if (legs.length === 0) {
    alert("Add at least one leg");
    return;
  }

  fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slip: legs })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("results").innerHTML = `
        <h3>Analysis</h3>
        <strong>Confidence:</strong> ${data.confidenceScore}%<br>
        <strong>Risk:</strong> ${data.riskLevel}<br>
        <strong>Warnings:</strong>
        <ul>${data.warnings.map(w => `<li>${w}</li>`).join("")}</ul>
      `;
    })
    .catch(() => {
      alert("Server not responding");
    });
}
