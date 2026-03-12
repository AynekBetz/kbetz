"use client"

import { useEffect, useState } from "react"

export default function Scanner(){

 const [bets,setBets] = useState<any[]>([])

 useEffect(()=>{

  fetch("http://localhost:10000/api/ev")
  .then(res=>res.json())
  .then(data=>setBets(data))

 },[])

 return(

 <div>

 <h1>Value Bet Scanner</h1>

 {bets.map((bet,i)=>(
  <div key={i}>
  {bet.game} — {bet.bet} — {bet.EV}
  </div>
 ))}

 </div>

 )

}