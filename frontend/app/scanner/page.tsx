"use client"

import { useEffect, useState } from "react"

export default function ScannerPage() {

  const [scannerData, setScannerData] = useState([])

  useEffect(() => {

    fetch("https://kbetz-1.onrender.com/scanner")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setScannerData(data)
        } else {
          setScannerData([])
        }
      })
      .catch(() => setScannerData([]))

  }, [])

  return (
    <div style={{ padding: 30 }}>
      <h1>Live Betting Scanner</h1>

      {scannerData.length === 0 && <p>No scanner results yet.</p>}

      {scannerData.map((bet, i) => (
        <div key={i} style={{border:"1px solid #444",padding:15,marginBottom:10}}>
          <h3>{bet.game}</h3>
          <p>{bet.pick}</p>
          <p>EV: {bet.ev}</p>
        </div>
      ))}

    </div>
  )
}