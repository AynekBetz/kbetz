export const dynamic = "force-dynamic";

const BACKEND_URL = "https://kbetz-live.onrender.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authorization = req.headers.get("authorization");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authorization) {
      headers.Authorization = authorization;
    }

    const response = await fetch(`${BACKEND_URL}/api/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({
      error: "Invalid checkout response",
    }));

    return Response.json(data, {
      status: response.status,
    });

  } catch (error: any) {
    console.error("KBETZ frontend checkout proxy error:", error);

    return Response.json(
      {
        error: "Checkout connection failed",
        details: error?.message || "Unknown checkout proxy error",
      },
      {
        status: 500,
      }
    );
  }
} // ← THIS BRACE WAS MISSING

export async function GET() {
  return Response.json(
    {
      ok: true,
      route: "KBETZ checkout proxy",
      backend: BACKEND_URL,
    },
    {
      status: 200,
    }
  );
}