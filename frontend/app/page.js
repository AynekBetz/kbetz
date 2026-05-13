"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // redirect instantly to dashboard
    router.push("/dashboard");
  }, []);

  return (
    <div style={{ color: "white", padding: "20px" }}>
      Loading KBETZ...
    </div>
  );
}