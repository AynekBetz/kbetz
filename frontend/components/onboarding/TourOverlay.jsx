"use client";

import { useEffect, useState } from "react";

export default function TourOverlay({
  open = false,
  targetSelector = "",
}) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!open || !targetSelector) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(targetSelector);

      if (!el) {
        setRect(null);
        return;
      }

      const r = el.getBoundingClientRect();

      setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, targetSelector]);

  if (!open) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.72)",
          backdropFilter: "blur(4px)",
          zIndex: 9996,
          pointerEvents: "none",
        }}
      />

      {rect && (
        <div
          style={{
            position: "fixed",
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: 18,
            border: "2px solid #00ffe1",
            boxShadow:
              "0 0 18px rgba(0,255,225,.9), 0 0 40px rgba(124,58,237,.55)",
            zIndex: 9997,
            pointerEvents: "none",
            transition: "all .25s ease",
          }}
        />
      )}
    </>
  );
}
