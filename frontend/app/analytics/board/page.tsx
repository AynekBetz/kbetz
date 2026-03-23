"use client"

import { useEffect, useState } from "react"
import GlassPanel from "@/components/GlassPanel"
import TradingBoard from "@/components/TradingBoard"

export default function TradingBoardPage() {

  const [boardData, setBoardData] = useState<any[]>([])

  useEffect(() => {

    async function loadFeed() {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/feed`
      )

      const data = await res.json()

      const rows = Array.isArray(data) ? data : data?.data || []

      const grouped: any = {}

      rows.forEach((row: any) => {

        if (!grouped[row.game]) {

          grouped[row.game] = {
            game: row.game,
            markets: []
          }

        }

        grouped[row.game].markets.push({
          market: row.market,
          books: [
            { book: row.book, odds: row.odds }
          ]
        })

      })

      setBoardData(Object.values(grouped))

    }

    loadFeed()

  }, [])

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Trading Board
      </h1>

      <GlassPanel>

        <TradingBoard data={boardData} />

      </GlassPanel>

    </div>

  )

}