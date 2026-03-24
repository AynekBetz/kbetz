import "./globals.css";

export const metadata = {
  title: "KBETZ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        <div className="nav">
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/analytics">Analytics</a>
          <a href="/scanner">Scanner</a>
          <a href="/lines">Lines</a>
          <a href="/bets">Bets</a>
          <a href="/settings">Settings</a>
        </div>

        {children}

      </body>
    </html>
  );
}