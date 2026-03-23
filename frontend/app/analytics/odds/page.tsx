"use client"

import { useEffect, useState } from "react"
import GlassPanel from "@/components/GlassPanel"
import OddsGrid from "@/components/OddsGrid"

interface FeedRow {
  game?: string
  market?: string
  book?: string
  odds?: number
}

interface GridRow {
  game: string
  market: string
  books: {
    book: string
    odds: number
  }[]
}

export default function OddsDashboard() {

  const [gridData, setGridData] = useState<GridRow[]>([])

  useEffect(() => {

    async function loadFeed() {

      try {

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/feed`
        )

        const data = await res.json()

        const rows: FeedRow[] = Array.isArray(data)
          ? data
          : data?.data || []

        const grouped: { [key: string]: GridRow } = {}

        rows.forEach(row => {

          const key = `${row.game}-${row.market}`

          if (!grouped[key]) {

            grouped[key] = {
              game: row.game || "Game",
              market: row.market || "-",
              books: []
            }

          }

          if (row.book && row.odds) {

            grouped[key].books.push({
              book: row.book,
              odds: row.odds
            })

          }

        })

        setGridData(Object.values(grouped))

      } catch (err) {

        console.error("Feed error:", err)

      }

    }

    loadFeed()

  }, [])

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Live Odds
      </h1>

      <GlassPanel>

        <OddsGrid data={gridData} />

      </GlassPanel>

    </div>

  )

}