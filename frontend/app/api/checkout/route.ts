import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1
      }
    ],
    success_url: "https://kbetz-frontend.vercel.app/dashboard",
    cancel_url: "https://kbetz-frontend.vercel.app/dashboard"
  });

  return NextResponse.redirect(session.url!);
}