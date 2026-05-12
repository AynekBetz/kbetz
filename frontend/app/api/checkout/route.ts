export const dynamic = "force-dynamic";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: "https://kbetz-frontend.vercel.app/dashboard",
      cancel_url: "https://kbetz-frontend.vercel.app/dashboard",
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.log(err);
    return Response.json({ error: "Stripe failed" });
  }
}