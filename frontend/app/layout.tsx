export default function RootLayout({ children }) {
  return (
    <html>
      <body style={{ margin: 0, background: "#000" }}>
        {children}
      </body>
    </html>
  );
}