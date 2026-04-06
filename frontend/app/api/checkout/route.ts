import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 🔥 HANDLE BOTH GET + POST
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

// ✅ GET (browser direct)
export async function GET() {
  try {
    const session = await createSession();
    return NextResponse.redirect(session.url!);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ POST (fetch)
export async function POST() {
  try {
    const session = await createSession();
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}