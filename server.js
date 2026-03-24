import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 🔥 STRIPE INIT
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ========================
// TEST ROOT
// ========================
app.get("/", (req, res) => {
  res.send("KBETZ LIVE ✅");
});

// ========================
// ODDS
// ========================
app.get("/odds", (req, res) => {
  res.json([
    {
      id: "1",
      home_team: "Lakers",
      away_team: "Warriors",
      markets: [
        {
          outcomes: [
            { name: "Lakers", price: -120 },
            { name: "Warriors", price: 105 },
          ],
        },
      ],
    },
    {
      id: "2",
      home_team: "Celtics",
      away_team: "Bucks",
      markets: [
        {
          outcomes: [
            { name: "Celtics", price: -140 },
            { name: "Bucks", price: 120 },
          ],
        },
      ],
    },
  ]);
});

// ========================
// 🔥 CREATE STRIPE CHECKOUT
// ========================
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
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Stripe error" });
  }
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log(`🚀 KBETZ server running on ${PORT}`);
});