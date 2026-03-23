"use client"

import { useEffect, useState } from "react"

import TradingBoard from "@/components/TradingBoard"

export default function TerminalPage() {

  const [data, setData] = useState<any[]>([])

  useEffect(() => {

    const API = process.env.NEXT_PUBLIC_API_URL || ""

    async function loadData() {

      try {

        const res = await fetch(`${API}/api/feed`)
        const json = await res.json()

        const rows = Array.isArray(json)
          ? json
          : json?.data || []

        setData(rows)

      } catch (err) {

        console.error("Terminal feed error:", err)

      }

    }

    loadData()

  }, [])

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Market Trading Terminal
      </h1>

      <TradingBoard data={data} />

    </div>

  )

}