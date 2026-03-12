"use client"

import { useRef } from "react"
import { toPng } from "html-to-image"

export default function BetCard({ bet }: any) {

 const cardRef = useRef<HTMLDivElement>(null)

 const download = async () => {

  if (!cardRef.current) return

  const dataUrl = await toPng(cardRef.current)

  const link = document.createElement("a")

  link.download = "kbetz-bet.png"
  link.href = dataUrl
  link.click()

 }

 return (

  <div style={{marginTop:10}}>

   <div
    ref={cardRef}
    style={{
     background:"#020617",
     padding:20,
     borderRadius:10,
     border:"1px solid rgba(148,163,184,0.2)",
     width:260
    }}
   >

    <h3>🔥 KBETZ AI PLAY</h3>

    <p>{bet.game}</p>

    <p>
     <strong>{bet.bet}</strong>
    </p>

    <p>EV: {bet.EV}</p>

   </div>

   <button
    onClick={download}
    style={{
     marginTop:8,
     padding:"6px 10px",
     cursor:"pointer"
    }}
   >
    Download Card
   </button>

  </div>

 )

}