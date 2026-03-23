"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

interface ScannerItem {
  game?: string
  match?: string
  market?: string
  edge?: number | string
  book?: string
}

export default function ScannerPage() {

  const [feed, setFeed] = useState<ScannerItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL as string

    // 1️⃣ Load initial scanner feed
    async function loadFeed() {

      try {

        const res = await fetch(`${API_URL}/api/feed`)
        const data = await res.json()

        if (Array.isArray(data)) {
          setFeed(data)
        } else if (data?.data) {
          setFeed(data.data)
        }

      } catch (err) {

        console.error("Feed fetch error:", err)

      } finally {

        setLoading(false)

      }

    }

    loadFeed()

    // 2️⃣ Connect to live scanner
    const socket: Socket = io(API_URL, {
      transports: ["websocket"]
    })

    socket.on("connect", () => {
      console.log("Connected to KBETZ live scanner")
    })

    socket.on("scannerUpdate", (data: ScannerItem[]) => {

      if (Array.isArray(data)) {
        setFeed(data)
      }

    })

    socket.on("disconnect", () => {
      console.log("Disconnected from scanner")
    })

    return () => {
      socket.disconnect()
    }

  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">KBETZ Scanner</h1>
        <p className="mt-4">Loading live scanner...</p>
      </div>
    )
  }

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        KBETZ Live Scanner
      </h1>

      {feed.length === 0 && (
        <div>No opportunities detected yet.</div>
      )}

      {feed.map((item, index) => (

        <div
          key={index}
          className="border rounded-lg p-4 mb-4 shadow-sm"
        >

          <div className="font-semibold text-lg">
            {item.game || item.match || "Unknown Game"}
          </div>

          {item.market && (
            <div>Market: {item.market}</div>
          )}

          {item.edge && (
            <div>Edge: {item.edge}</div>
          )}

          {item.book && (
            <div>Book: {item.book}</div>
          )}

        </div>

      ))}

    </div>
  )
}