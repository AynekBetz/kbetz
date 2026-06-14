export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.KBETZ_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://kbetz-main.onrender.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "Invalid backend response" };
    }

    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json(
      {
        error: "Login proxy failed",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    route: "KBETZ login proxy",
    backend: BACKEND_URL,
  });
}
