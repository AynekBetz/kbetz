export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{ display: "flex" }}>
          
          {/* SIDEBAR */}
          <div
            style={{
              width: "200px",
              background: "#111",
              color: "white",
              padding: "20px",
              height: "100vh",
              position: "relative",
              zIndex: 1
            }}
          >
            <h3>KBETZ</h3>
            <p>Dashboard</p>
            <p>Scanner</p>
            <p>Analytics</p>
          </div>

          {/* 🔥 MAIN CONTENT FIX */}
          <div
            style={{
              flex: 1,
              padding: "20px",

              /* 🔥 CRITICAL FIXES */
              position: "relative",
              zIndex: 9999,
              pointerEvents: "auto"
            }}
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}