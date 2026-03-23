"use client"

import { useEffect, useState } from "react"

export default function LinesPage() {

  const [lines, setLines] = useState<any[]>([])

  useEffect(() => {

    const API = process.env.NEXT_PUBLIC_API_URL || ""

    async function fetchLines() {

      try {

        const res = await fetch(`${API}/api/feed`)
        const data = await res.json()

        const rows = Array.isArray(data)
          ? data
          : data?.data || []

        setLines(rows)

      } catch (err) {

        console.error("Failed to load lines:", err)

      }

    }

    fetchLines()

  }, [])

  return (

    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Line Movement
      </h1>

      {lines.length === 0 && (
        <div className="opacity-60 text-sm">
          Waiting for line movement data...
        </div>
      )}

      <div className="space-y-3">

        {lines.map((row, i) => (

          <div
            key={i}
            className="p-3 rounded-lg bg-white/5 border border-white/10"
          >

            <div className="font-semibold text-sm">
              {row.game}
            </div>

            <div className="text-xs opacity-70">
              {row.market} — {row.book}
            </div>

            <div className="text-xs mt-1">

              Odds: {row.odds}

              {row.movement !== undefined && (
                <span className="ml-3">
                  Movement: {row.movement}
                </span>
              )}

            </div>

          </div>

        ))}

      </div>

    </div>

  )

}