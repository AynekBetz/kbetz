export async function getOdds() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odds`);
    return await res.json();
  } catch {
    return [];
  }
}