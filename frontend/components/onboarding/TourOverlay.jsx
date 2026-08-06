"use client";

import { useEffect, useState } from "react";

export default function TourOverlay({
  open = false,
  targetSelector = "",
  padding = 10,
}) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!open || !targetSelector) {
      setRect(null);
      return;
    }

    let frameId = null;

    const update = () => {
      const element = document.querySelector(targetSelector);

      if (!element) {
        setRect(null);
        return;
      }

      const nextRect = element.getBoundingClientRect();

      setRect({
        top: nextRect.top,
        left: nextRect.left,
        width: nextRect.width,
        height: nextRect.height,
      });
    };

    const scheduleUpdate = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(update);
    };

    update();

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [open, targetSelector]);

  if (!open) {
    return null;
  }

  if (!rect) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9996,
          pointerEvents: "none",
          background: "rgba(0,0,0,.72)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: Math.max(8, rect.top - padding),
        left: Math.max(8, rect.left - padding),
        width: Math.max(20, rect.width + padding * 2),
        height: Math.max(20, rect.height + padding * 2),
        zIndex: 9997,
        pointerEvents: "none",
        borderRadius: 20,
        border: "2px solid #00ffe1",
        background: "transparent",
        boxShadow:
          "0 0 0 9999px rgba(0,0,0,.72), " +
          "0 0 20px rgba(0,255,225,.95), " +
          "0 0 48px rgba(124,58,237,.68), " +
          "inset 0 0 24px rgba(0,255,225,.08)",
        transition:
          "top .32s ease, left .32s ease, width .32s ease, height .32s ease",
      }}
    />
  );
}
