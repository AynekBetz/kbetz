export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0b0b0f",
          color: "white"
        }}
      >
        <div style={{ display: "flex" }}>
          
          {/* SIDEBAR */}
          <div
            style={{
              width: "200px",
              background: "#111",
              padding: "20px",
              height: "100vh"
            }}
          >
            <h3>KBETZ</h3>
            <p>Dashboard</p>
            <p>Scanner</p>
            <p>Analytics</p>
          </div>

          {/* MAIN CONTENT (FIXED) */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              position: "relative",
              zIndex: 1,              // ✅ FIX
              pointerEvents: "auto"  // ✅ FIX
            }}
          >
            {children}
          </div>

        </div>
      </body>
    </html>
  );
}