export const dynamic = "force-dynamic";

const BACKEND_URL = "https://kbetz-main.onrender.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("KBETZ frontend checkout proxy error:", error);

    return Response.json(
      {
        error: "Checkout connection failed",
      },
      {
        status: 500,
      }
    );
  }
}

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