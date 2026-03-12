import express from "express"
import Stripe from "stripe"

const router = express.Router()

router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {

  try {

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const sig = req.headers["stripe-signature"]

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    /* =========================
       HANDLE STRIPE EVENTS
    ========================= */

    if (event.type === "checkout.session.completed") {

      const session = event.data.object

      const email = session.customer_email

      console.log("Subscription started for:", email)

      // TODO: update user plan to PRO

    }

    if (event.type === "customer.subscription.deleted") {

      console.log("Subscription cancelled")

      // TODO: downgrade plan

    }

    res.json({ received: true })

  } catch (err) {

    console.log("Webhook error:", err.message)

    res.status(400).send(`Webhook Error: ${err.message}`)

  }

})

export default router