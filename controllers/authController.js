import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

let users = []

export async function signup(req,res){

 const {email,password}=req.body

 const hashed=await bcrypt.hash(password,10)

 const user={
  id:Date.now(),
  email,
  password:hashed
 }

 users.push(user)

 res.json({message:"User created"})

}

export async function login(req,res){

 const {email,password}=req.body

 const user=users.find(u=>u.email===email)

 if(!user){
  return res.status(401).json({error:"Invalid login"})
 }

 const match=await bcrypt.compare(password,user.password)

 if(!match){
  return res.status(401).json({error:"Invalid login"})
 }

 const token=jwt.sign(
  {userId:user.id},
  process.env.JWT_SECRET || "secret",
  {expiresIn:"7d"}
 )

 res.json({token})

}