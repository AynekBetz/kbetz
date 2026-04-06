import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createSession() {
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1
      }
    ],
    success_url: "https://kbetz-frontend.vercel.app/dashboard?success=true",
    cancel_url: "https://kbetz-frontend.vercel.app/dashboard"
  });
}

export async function GET() {
  const session = await createSession();
  return NextResponse.redirect(session.url!);
}

export async function POST() {
  const session = await createSession();
  return NextResponse.json({ url: session.url });
}