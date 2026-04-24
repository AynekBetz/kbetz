// ONLY ODDS — NO STRIPE ANYWHERE

export async function getOdds() {
  try {
    const res = await fetch(`${"https://kbetz.onrender.com"}/api/odds`);
    return await res.json();
  } catch {
    return [];
  }
}