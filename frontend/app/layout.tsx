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
      <body style={{ margin: 0, padding: 0, background: "black", color: "white" }}>
        {children}
      </body>
    </html>
  );
}