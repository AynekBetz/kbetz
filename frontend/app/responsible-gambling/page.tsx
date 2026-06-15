export default function ResponsibleGamblingPage() {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.logo}>Responsible Gambling</h1>
        <p style={styles.updated}>Last updated: 2026</p>

        <p>
          KBETZ is designed for sports analytics and informational use only.
          Sports betting involves risk. No pick, model, projection, edge score,
          or AI insight can guarantee profit.
        </p>

        <h2>Bet Responsibly</h2>
        <p>
          Only bet what you can afford to lose. Do not chase losses. Do not use
          betting as a source of guaranteed income. If betting stops being fun
          or begins affecting your finances, relationships, work, or mental
          health, consider taking a break and seeking support.
        </p>

        <h2>KBETZ Is Not a Sportsbook</h2>
        <p>
          KBETZ does not accept wagers, does not hold deposits, does not process
          betting transactions, and does not place bets for users.
        </p>

        <h2>No Guaranteed Wins</h2>
        <p>
          All analytics, AI picks, parlay tools, odds movement alerts, and
          confidence scores are estimates and educational tools. Past results
          do not guarantee future outcomes.
        </p>

        <h2>Get Help</h2>
        <p>
          If you or someone you know may have a gambling problem, seek help from
          a qualified professional or a responsible gambling support
          organization in your area.
        </p>

        <p style={styles.warning}>
          If you feel unable to control gambling behavior, stop using betting
          tools immediately and seek support.
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 18px",
    background:
      "radial-gradient(circle at 18% 20%, rgba(0,255,214,.16), transparent 30%), radial-gradient(circle at 86% 18%, rgba(210,45,255,.22), transparent 30%), linear-gradient(135deg, #020707, #041313 42%, #090212)",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  card: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "34px 28px",
    borderRadius: 24,
    border: "1px solid rgba(0,255,214,.42)",
    background: "linear-gradient(145deg, rgba(3,19,22,.94), rgba(12,3,24,.92))",
    boxShadow: "0 0 38px rgba(0,255,214,.16)",
    lineHeight: 1.7,
  },
  logo: {
    margin: "0 0 8px",
    fontSize: 36,
    fontWeight: 1000,
    background: "linear-gradient(90deg, #00ffd6, #63eaff, #d72dff)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  updated: {
    color: "rgba(255,255,255,.62)",
    marginBottom: 24,
  },
  warning: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(255,77,109,.45)",
    background: "rgba(255,77,109,.08)",
    color: "#ffd5dd",
    fontWeight: 800,
  },
};
