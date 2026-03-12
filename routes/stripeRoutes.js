import express from "express"
import Stripe from "stripe"

const router = express.Router()

router.post("/create-checkout-session", async (req,res)=>{

 try{

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const session = await stripe.checkout.sessions.create({

   payment_method_types:["card"],

   mode:"subscription",

   line_items:[
    {
     price:process.env.STRIPE_PRICE_ID,
     quantity:1
    }
   ],

   success_url:"http://localhost:3000/success",

   cancel_url:"http://localhost:3000/pricing"

  })

  res.json({url:session.url})

 }catch(error){

  console.error("Stripe error:",error)

  res.status(500).json({error:error.message})

 }

})

export default router