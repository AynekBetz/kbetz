"use client"

import Link from "next/link"

export default function RootLayout({ children }: { children: React.ReactNode }) {

 return (

  <html>

  <body style={{margin:0,fontFamily:"system-ui"}}>

  <div style={{display:"flex",minHeight:"100vh"}}>

  {/* SIDEBAR */}

  <div style={{
   width:"220px",
   background:"#020617",
   color:"white",
   padding:"20px"
  }}>

  <h2 style={{marginBottom:"30px"}}>KBETZ</h2>

  <nav style={{display:"flex",flexDirection:"column",gap:"15px"}}>

  <Link href="/">Dashboard</Link>

  <Link href="/scanner">Scanner</Link>

  <Link href="/lines">Line Shop</Link>

  <Link href="/bets">Bets</Link>

  <Link href="/analytics">Analytics</Link>

  <Link href="/settings">Settings</Link>

  </nav>

  </div>

  {/* MAIN CONTENT */}

  <div style={{
   flex:1,
   background:"linear-gradient(135deg,#0b0f19,#020617)",
   color:"white",
   padding:"40px"
  }}>

  {children}

  </div>

  </div>

  </body>

  </html>

 )

}