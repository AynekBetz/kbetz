export function requirePlan(plan){

 return (req,res,next)=>{

  const user=req.user

  if(!user){
   return res.status(401).json({error:"Unauthorized"})
  }

  const plans={
   FREE:0,
   PRO:1,
   ELITE:2
  }

  const userPlan = user.plan || "FREE"

  if(plans[userPlan] < plans[plan]){
   return res.status(403).json({
    error:"Upgrade required",
    requiredPlan:plan
   })
  }

  next()

 }

}