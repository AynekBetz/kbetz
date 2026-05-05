"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // ALWAYS go to dashboard (no login block)
    router.replace("/dashboard");
  }, []);

  return (
    <div style={{
      height: "100vh",
      background: "#050505",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      Loading KBETZ...
    </div>
  );
}