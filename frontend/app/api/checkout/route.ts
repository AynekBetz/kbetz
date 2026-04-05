// ✅ SAFE PLACEHOLDER (prevents Stripe build crash)

export async function POST() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Handled by backend",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}