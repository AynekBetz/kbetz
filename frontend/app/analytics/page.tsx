"use client"

import { useEffect, useState } from "react"
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 Tooltip,
 ResponsiveContainer
} from "recharts"

export default function Analytics(){

 const [stats,setStats] = useState<any>({})
 const [bets,setBets] = useState<any[]>([])

 useEffect(()=>{

  fetch("http://localhost:10000/api/stats")
   .then(res=>res.json())
   .then(data=>setStats(data))

  fetch("http://localhost:10000/api/bets")
   .then(res=>res.json())
   .then(data=>setBets(data))

 },[])

 const chartData = [
  {day:"Mon",profit:10},
  {day:"Tue",profit:25},
  {day:"Wed",profit:40},
  {day:"Thu",profit:35},
  {day:"Fri",profit:60}
 ]

 return(

 <div>

 <h1 style={{marginBottom:20}}>
 Bankroll Analytics
 </h1>


 {/* STATS */}

 <div className="card">

 <h2>Performance</h2>

 <p>Profit: ${stats.profit}</p>
 <p>ROI: {stats.roi}%</p>
 <p>Win Rate: {stats.winRate}%</p>

 </div>


 {/* CHART */}

 <div className="card">

 <h2>Bankroll Growth</h2>

 <ResponsiveContainer width="100%" height={300}>

 <LineChart data={chartData}>

 <XAxis dataKey="day"/>
 <YAxis/>
 <Tooltip/>

 <Line
 type="monotone"
 dataKey="profit"
 stroke="#22c55e"
 />

 </LineChart>

 </ResponsiveContainer>

 </div>


 {/* BET HISTORY */}

 <div className="card">

 <h2>Recent Bets</h2>

 {bets.map((bet,i)=>(

  <div key={i} style={{marginBottom:10}}>

   {bet.game} — {bet.bet}

   <span style={{
    marginLeft:10,
    color:bet.result === "win" ? "#22c55e" : "#ef4444"
   }}>

   {bet.result}

   </span>

  </div>

 ))}

 </div>

 </div>

 )

}