export async function POST() {
  try {
    // 🔥 LOAD STRIPE ONLY WHEN CALLED
    const Stripe = (await import("stripe")).default;

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],

      success_url: "https://kbetz.vercel.app/dashboard",
      cancel_url: "https://kbetz.vercel.app/dashboard",
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err.message);

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}