"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      console.log("Routing fallback:", err);
      window.location.href = "/login";
    }
  }, []);

  return (
    <div style={{
      height: "100vh",
      background: "#000",
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      Loading KBETZ...
    </div>
  );
}