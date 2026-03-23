"use client"

import { useEffect, useState } from "react"
import GlassPanel from "@/components/GlassPanel"

interface Bet {
  game?: string
  market?: string
  edge?: number
  book?: string
}

export default function EVHeatmap() {

  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {

    async function loadEV() {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ev`
      )

      const data = await res.json()

      if (Array.isArray(data)) {
        setBets(data)
      }

    }

    loadEV()

  }, [])

  return (

    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        EV Heatmap
      </h1>

      <GlassPanel>

        <div className="grid grid-cols-4 gap-4">

          {bets.map((bet, i) => (

            <div
              key={i}
              className={`p-4 rounded-lg text-white ${
                (bet.edge ?? 0) > 5
                  ? "bg-green-600"
                  : (bet.edge ?? 0) > 2
                  ? "bg-yellow-500"
                  : "bg-gray-600"
              }`}
            >

              <div className="font-semibold">
                {bet.game || "Game"}
              </div>

              <div>{bet.market}</div>

              <div>
                EV: {bet.edge ?? 0}%
              </div>

              <div>{bet.book}</div>

            </div>

          ))}

        </div>

      </GlassPanel>

    </div>

  )

}