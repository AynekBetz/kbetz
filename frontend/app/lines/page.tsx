"use client"

import { useEffect, useState } from "react"

export default function Lines(){

 const [lines,setLines] = useState<any[]>([])

 useEffect(()=>{

  fetch("http://localhost:10000/api/line-shopping")
  .then(res=>res.json())
  .then(data=>setLines(data))

 },[])

 return(

 <div>

 <h1>Sportsbook Line Shopping</h1>

 {lines.map((line,i)=>(
  <div key={i}>
  {line.game} — {line.side}

  <div>
  Best: {line.bestBook} {line.bestPrice}
  </div>

  </div>
 ))}

 </div>

 )

}