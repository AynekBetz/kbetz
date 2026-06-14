"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 18% 20%, rgba(0,255,214,.18), transparent 30%), radial-gradient(circle at 86% 18%, rgba(210,45,255,.24), transparent 30%), linear-gradient(135deg, #020707, #041313 42%, #090212)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: 28,
          borderRadius: 20,
          border: "1px solid rgba(0,255,214,.45)",
          background:
            "linear-gradient(145deg, rgba(3,19,22,.95), rgba(12,3,24,.93))",
          boxShadow: "0 0 38px rgba(0,255,214,.18)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 42,
            fontWeight: 1000,
            letterSpacing: 2,
            background: "linear-gradient(90deg, #00ffd6, #63eaff, #d72dff)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          KBETZ
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontWeight: 900 }}>
          Opening Signature Login...
        </p>
      </div>
    </main>
  );
}
