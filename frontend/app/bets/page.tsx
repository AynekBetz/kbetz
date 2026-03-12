"use client"

import { useEffect,useState } from "react"

export default function Bets(){

 const [bets,setBets] = useState<any[]>([])

 useEffect(()=>{

  fetch("http://localhost:10000/api/bets")
  .then(res=>res.json())
  .then(data=>setBets(data))

 },[])

 return(

 <div>

 <h1>Bet Tracker</h1>

 {bets.map((bet,i)=>(
  <div key={i}>
  {bet.game} — {bet.bet} — ${bet.stake}
  </div>
 ))}

 </div>

 )

}