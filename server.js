import express from "express";
import cors from "cors";
import Stripe from "stripe";

const app = express();

// 🔥 STRONG CORS FIX
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json());

const PORT = process.env.PORT || 10000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ROOT
app.get("/", (req, res) => {
  res.send("KBETZ API LIVE ✅");
});

// HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "ok", connected: true });
});

// USER
app.get("/me", (req, res) => {
  res.json({
    user: {
      id: "demo-user",
      email: "demo@kbetz.com",
      plan: "free"
    }
  });
});

// STRIPE
app.post("/create-checkout-session", async (req, res) => {
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
      success_url: "https://kbetz.vercel.app/success",
      cancel_url: "https://kbetz.vercel.app",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 KBETZ API running on port ${PORT}`);
});