export async function POST() {
  try {
    const res = await fetch(
      "https://kbetz-2.onrender.com/create-checkout-session",
      {
        method: "POST",
      }
    );

    const data = await res.json();

    return Response.json(data);
  } catch (err) {
    console.error("Checkout error:", err);

    return Response.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}