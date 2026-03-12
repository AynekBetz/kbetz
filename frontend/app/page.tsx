"use client"

import { useEffect, useState } from "react"
import io from "socket.io-client"
import BetCard from "../components/BetCard"

const socket = io("http://localhost:10000")

export default function Dashboard(){

 const [evBets,setEvBets] = useState<any[]>([])
 const [arbs,setArbs] = useState<any[]>([])
 const [steam,setSteam] = useState<any[]>([])
 const [lines,setLines] = useState<any[]>([])
 const [feed,setFeed] = useState<any[]>([])
 const [aiBet,setAiBet] = useState<any>(null)

 useEffect(()=>{

  const token = localStorage.getItem("token")

  /* EV BETS */

  fetch("http://localhost:10000/api/ev",{
   headers:{ Authorization:`Bearer ${token}` }
  })
   .then(res=>res.json())
   .then(data=>setEvBets(data))
   .catch(()=>setEvBets([]))


  /* ARBITRAGE */

  fetch("http://localhost:10000/api/arbitrage")
   .then(res=>res.json())
   .then(data=>setArbs(data))
   .catch(()=>setArbs([]))


  /* STEAM */

  fetch("http://localhost:10000/api/steam")
   .then(res=>res.json())
   .then(data=>setSteam(data))
   .catch(()=>setSteam([]))


  /* LINE SHOPPING */

  fetch("http://localhost:10000/api/line-shopping")
   .then(res=>res.json())
   .then(data=>setLines(data))
   .catch(()=>setLines([]))


  /* MARKET FEED */

  fetch("http://localhost:10000/api/feed")
   .then(res=>res.json())
   .then(data=>setFeed(data))
   .catch(()=>setFeed([]))


  /* DAILY AI BET */

  fetch("http://localhost:10000/api/ai-bet")
   .then(res=>res.json())
   .then(data=>setAiBet(data))


  /* REALTIME SIGNALS */

  socket.on("market-update",(data:any)=>{

   if(data.ev) setEvBets(data.ev)
   if(data.arbs) setArbs(data.arbs)
   if(data.steam) setSteam(data.steam)

  })

 },[])


 return(

 <div>

 <h1 style={{marginBottom:20}}>
 KBETZ Terminal
 </h1>


 {/* MARKET TICKER */}

 <div className="ticker">

 {(Array.isArray(feed) ? feed : []).map((item,i)=>(

  <span key={i}>
   {item.game} {item.side} {item.price} ({item.book})
  </span>

 ))}

 </div>


 {/* DAILY AI BET */}

 <div className="card">

 <h2>🔥 Daily AI Bet</h2>

 {aiBet && (

 <div>

 <p>{aiBet.game}</p>

 <p>
 <strong>{aiBet.bet}</strong>
 </p>

 <p>EV: {aiBet.EV}</p>

 <p>Confidence: {aiBet.confidence}%</p>

 </div>

 )}

 </div>


 {/* EV HEATMAP */}

 <div className="card">

 <h2 style={{marginBottom:20}}>
 EV Heatmap
 </h2>

 <div className="heatmap">

 {(Array.isArray(evBets) ? evBets : []).map((bet,i)=>{

  const ev = parseFloat(bet.EV)

  let heatClass="heat-low"

  if(ev > 6) heatClass="heat-high"
  else if(ev > 3) heatClass="heat-medium"

  return(

  <div key={i} className={`heat-tile ${heatClass}`}>

   <div style={{fontWeight:600}}>
    {bet.game}
   </div>

   <div>{bet.bet}</div>

   <div>{bet.EV}</div>

   <BetCard bet={bet}/>

  </div>

  )

 })}

 </div>

 </div>


 {/* ARBITRAGE */}

 <div className="card">

 <h2 style={{marginBottom:20}}>
 Arbitrage Opportunities
 </h2>

 {(Array.isArray(arbs) ? arbs : []).map((arb,i)=>(

  <div key={i} style={{marginBottom:10}}>
   {arb.matchup} — {arb.profitMargin?.toFixed(2)}%
  </div>

 ))}

 </div>


 {/* STEAM MOVES */}

 <div className="card">

 <h2 style={{marginBottom:20}}>
 Steam Moves
 </h2>

 {(Array.isArray(steam) ? steam : []).map((move,i)=>(

  <div key={i} style={{marginBottom:10}}>
   {move.game} — {move.movement}
  </div>

 ))}

 </div>


 {/* SPORTSBOOK COMPARISON */}

 <div className="card">

 <h2 style={{marginBottom:20}}>
 Sportsbook Comparison
 </h2>

 {(Array.isArray(lines) ? lines : []).map((line,i)=>(

  <div key={i} style={{marginBottom:15}}>

   <div style={{marginBottom:6}}>
    {line.game} — {line.side}
   </div>

   <div>

   {(Array.isArray(line.allBooks) ? line.allBooks : []).map((b:any,j:number)=>(

    <span key={j} className="odds-pill">
     {b.book} {b.price}
    </span>

   ))}

   </div>

  </div>

 ))}

 </div>


 </div>

 )

}