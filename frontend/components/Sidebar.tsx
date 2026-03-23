"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {

  const pathname = usePathname()

  const links = [

    { name: "Dashboard", path: "/dashboard" },
    { name: "Scanner", path: "/scanner" },
    { name: "Terminal", path: "/analytics/terminal" },
    { name: "EV Heatmap", path: "/analytics/ev" },
    { name: "Odds Grid", path: "/analytics/odds" },
    { name: "Line Movement", path: "/analytics/lines" },
    { name: "Settings", path: "/settings" }

  ]

  return (

    <div className="h-screen w-56 bg-black/40 backdrop-blur border-r border-white/10 p-4">

      <div className="text-xl font-bold mb-6">
        KBETZ
      </div>

      <div className="space-y-2">

        {links.map((link) => {

          const active = pathname === link.path

          return (

            <Link
              key={link.path}
              href={link.path}
              className={`block px-3 py-2 rounded-lg text-sm transition
              ${active
                ? "bg-green-500/20 text-green-400"
                : "hover:bg-white/10"
              }`}
            >
              {link.name}
            </Link>

          )

        })}

      </div>

    </div>

  )

}