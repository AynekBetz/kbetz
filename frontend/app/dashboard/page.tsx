"use client";

export default function Dashboard() {
  return (
    <div
      style={{
        padding: "40px",
        background: "black",
        height: "100vh",
        color: "white"
      }}
    >
      <h1>CLICK TEST</h1>

      {/* TEST 1 */}
      <a href="https://google.com" target="_blank">
        GO TO GOOGLE
      </a>

      <br /><br />

      {/* TEST 2 */}
      <button
        onClick={() => alert("BUTTON CLICKED")}
        style={{
          padding: "20px",
          background: "red",
          marginTop: "20px"
        }}
      >
        CLICK BUTTON
      </button>
    </div>
  );
}