export const metadata = {
  title: "KBETZ",
  description: "KBETZ App",
};

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
          background: "#000",
          color: "#fff",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}