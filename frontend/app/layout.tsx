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
        {/* 🔥 NO SIDEBAR, NO FLEX, NO OVERLAYS */}
        <div
          style={{
            padding: "20px",
            position: "relative",
            zIndex: 1,
            pointerEvents: "auto"
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}