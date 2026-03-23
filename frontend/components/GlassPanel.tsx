"use client"

import React from "react"

type Props = {
  children: React.ReactNode
  className?: string
}

export default function GlassPanel({ children, className = "" }: Props) {

  return (

    <div
      className={`
        bg-white/5
        border border-white/10
        backdrop-blur-xl
        rounded-xl
        p-5
        shadow-lg
        ${className}
      `}
    >

      {children}

    </div>

  )

}