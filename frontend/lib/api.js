const API = process.env.NEXT_PUBLIC_API_URL;

export async function getOdds() {
  const res = await fetch(`${API}/api/odds`);
  return res.json();
}

export async function getLineMoves() {
  const res = await fetch(`${API}/api/line-moves`);
  return res.json();
}