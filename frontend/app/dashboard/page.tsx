"use client";

export default function Dashboard() {
  return (
    <div
      style={{
        padding: "40px",
        background: "#0b0b0f",
        color: "white",
        minHeight: "100vh",
        fontFamily: "Arial",
      }}
    >
      <h1>KBETZ TEST</h1>

      <button
        onClick={() => {
          window.location.href = "https://www.google.com";
        }}
        style={{
          marginTop: "20px",
          padding: "15px 20px",
          background: "red",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        TEST BUTTON
      </button>
    </div>
  );
}