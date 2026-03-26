export async function GET() {
  try {
    const res = await fetch("https://kbetz-2.onrender.com/health");

    const data = await res.json();

    return Response.json(data);
  } catch (err) {
    return Response.json({ connected: false });
  }
}