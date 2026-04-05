import "./globals.css";

export const metadata = {
  title: "KBETZ",
  description: "Sports Betting Analytics Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", color: "white" }}>
        {children}
      </body>
    </html>
  );
}