"use client"

import { useEffect, useState } from "react"

type Activity = {
  type: string
  message: string
}

export default function MarketActivityFeed() {

  const [activity, setActivity] = useState<Activity[]>([])

  useEffect(() => {

    async function loadActivity() {

      try {

        const steamRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/steam`
        )

        const evRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ev`
        )

        const steam = await steamRes.json()
        const ev = await evRes.json()

        const feed: Activity[] = []

        if (steam?.length) {

          steam.slice(0,3).forEach((s:any) => {

            feed.push({
              type: "steam",
              message: `${s.game || "Game"} line moved`
            })

          })

        }

        if (ev?.length) {

          ev.slice(0,3).forEach((b:any) => {

            feed.push({
              type: "ev",
              message: `${b.game || "Game"} +EV opportunity`
            })

          })

        }

        setActivity(feed)

      } catch (err) {

        console.log("Activity feed error", err)

      }

    }

    loadActivity()

    const interval = setInterval(loadActivity, 5000)

    return () => clearInterval(interval)

  }, [])

  return (

    <div className="space-y-3 text-sm">

      {activity.length === 0 && (
        <div className="opacity-50">No market activity yet</div>
      )}

      {activity.map((item, i) => (

        <div
          key={i}
          className={`p-3 rounded border border-white/10
          ${
            item.type === "steam"
              ? "bg-orange-500/10 text-orange-300"
              : "bg-green-500/10 text-green-300"
          }`}
        >

          <div className="font-semibold">

            {item.type === "steam" ? "🔥 Steam Move" : "⭐ EV Signal"}

          </div>

          <div className="text-xs opacity-80 mt-1">
            {item.message}
          </div>

        </div>

      ))}

    </div>

  )

}