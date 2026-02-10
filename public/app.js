let token = null;
let plan = "free";

async function login() {
  const email = document.getElementById("email").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  token = data.token;
  plan = data.plan;

  document.getElementById("results").innerText =
    `Logged in as ${plan.toUpperCase()}`;
}

async function upgrade() {
  const res = await fetch("/api/upgrade", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (data.success) {
    plan = "pro";
    alert("🎉 You are now PRO");
  }
}

async function checkHedge() {
  if (!token) return alert("Login required");

  const ev = -0.05; // example

  const res = await fetch("/api/hedge-check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ev }),
  });

  const data = await res.json();
  alert(data.message || data.error);
}
