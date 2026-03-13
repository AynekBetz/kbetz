"use client"

import { useEffect, useState } from "react"

export default function ScannerPage() {

  const [scannerData, setScannerData] = useState([])

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {

    fetch(`${API}/scanner`)
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
    <div style={{ padding: "30px" }}>

      <h1>Live Betting Scanner</h1>

      {(Array.isArray(scannerData) ? scannerData : []).length === 0 && (
        <p>No scanner data available yet.</p>
      )}

      {(Array.isArray(scannerData) ? scannerData : []).map((bet, i) => (
        <div key={i} style={{
          border: "1px solid #333",
          padding: "15px",
          marginBottom: "10px",
          borderRadius: "8px"
        }}>
          <h3>{bet.game}</h3>
          <p>Pick: {bet.pick}</p>
          <p>EV: {bet.ev}</p>
          <p>Book: {bet.book}</p>
        </div>
      ))}

    </div>
  )
}