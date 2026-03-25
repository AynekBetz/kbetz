import "./globals.css"
import Link from "next/link"

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {

 return (
  <html lang="en">
   <body>

    <div style={{display:"flex", height:"100vh"}}>

     {/* SIDEBAR */}

     <div
      style={{
       width:220,
       background:"#020617",
       color:"white",
       padding:20,
      }}
     >
      <h2 style={{marginBottom:30}}>KBETZ</h2>

      <nav style={{display:"flex", flexDirection:"column", gap:15}}>

       <Link href="/">Dashboard</Link>

       <Link href="/scanner">
        EV Scanner
       </Link>

       <Link href="/arbitrage">
        Arbitrage
       </Link>

       <Link href="/steam">
        Steam Moves
       </Link>

       <Link href="/lines">
        Line Shopping
       </Link>

       <Link href="/analytics">
        Analytics
       </Link>

      </nav>
     </div>


     {/* MAIN CONTENT */}

     <div
      style={{
       flex:1,
       background:"#0f172a",
       color:"white",
       padding:30,
       overflow:"auto",
      }}
     >
      {children}
     </div>

    </div>

   </body>
  </html>
 )
}