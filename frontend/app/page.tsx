"use client"

import { useEffect, useState } from "react"

export default function Dashboard() {

  const [evBets, setEvBets] = useState([])
  const [arb, setArb] = useState([])
  const [steam, setSteam] = useState([])
  const [lines, setLines] = useState([])

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {

    // EV BETS
    fetch(`${API}/ev`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvBets(data)
        } else {
          setEvBets([])
        }
      })
      .catch(() => setEvBets([]))

    // ARBITRAGE
    fetch(`${API}/arb`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setArb(data)
        } else {
          setArb([])
        }
      })
      .catch(() => setArb([]))

    // STEAM
    fetch(`${API}/steam`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSteam(data)
        } else {
          setSteam([])
        }
      })
      .catch(() => setSteam([]))

    // LINES
    fetch(`${API}/lines`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLines(data)
        } else {
          setLines([])
        }
      })
      .catch(() => setLines([]))

  }, [])

  return (
    <div className="dashboard">

      <h1>KBETZ Terminal</h1>

      <h2>🔥 Daily AI Bet</h2>
      <div className="heatmap">
        {(Array.isArray(evBets) ? evBets : []).slice(0,5).map((bet, i) => (
          <div key={i} className="betCard">
            <h3>{bet.game}</h3>
            <p>{bet.pick}</p>
            <p>EV: {bet.ev}</p>
          </div>
        ))}
      </div>

      <h2>EV Heatmap</h2>
      <div className="heatmap">
        {(Array.isArray(evBets) ? evBets : []).map((bet, i) => (
          <div key={i} className="heatCard">
            <p>{bet.game}</p>
            <p>{bet.pick}</p>
            <p>{bet.ev}%</p>
          </div>
        ))}
      </div>

      <h2>Arbitrage Opportunities</h2>
      <div>
        {(Array.isArray(arb) ? arb : []).map((a, i) => (
          <p key={i}>
            {a.game} — {a.edge}%
          </p>
        ))}
      </div>

      <h2>Steam Moves</h2>
      <div>
        {(Array.isArray(steam) ? steam : []).map((s, i) => (
          <p key={i}>
            {s.game} — {s.move}
          </p>
        ))}
      </div>

      <h2>Sportsbook Comparison</h2>
      <div>
        {(Array.isArray(lines) ? lines : []).map((l, i) => (
          <p key={i}>
            {l.game} — {l.book}: {l.odds}
          </p>
        ))}
      </div>

    </div>
  )
}