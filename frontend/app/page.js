"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const email = localStorage.getItem("email");

    if (email) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/auth";
    }
  }, []);

  return (
    <div style={{ color: "white", background: "#000", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      Loading KBETZ...
    </div>
  );
}