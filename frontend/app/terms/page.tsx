export default function TermsPage() {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.logo}>KBETZ Terms of Use</h1>
        <p style={styles.updated}>Last updated: 2026</p>

        <p>
          KBETZ is a sports analytics and entertainment platform. KBETZ provides
          data tools, AI-generated insights, odds tracking, parlay tools, and
          betting-related analytics for informational purposes only.
        </p>

        <h2>1. Not a Sportsbook</h2>
        <p>
          KBETZ is not a sportsbook, casino, gambling operator, payment wallet,
          or betting exchange. KBETZ does not accept wagers, does not hold user
          deposits, does not place bets for users, and does not guarantee any
          betting outcome.
        </p>

        <h2>2. No Guaranteed Results</h2>
        <p>
          All picks, projections, confidence scores, odds movements, and
          analytics are informational. Sports betting involves risk, and users
          may lose money. No KBETZ feature should be treated as financial advice,
          gambling advice, or a guaranteed winning system.
        </p>

        <h2>3. User Responsibility</h2>
        <p>
          You are responsible for complying with the laws in your location.
          You must be of legal age to view or use betting-related content in
          your jurisdiction.
        </p>

        <h2>4. Subscriptions and Billing</h2>
        <p>
          KBETZ PRO may be offered as a paid subscription. Billing is processed
          through Stripe or another third-party payment processor. Subscription
          access, pricing, renewals, cancellations, and payment handling may be
          subject to that provider’s terms.
        </p>

        <h2>5. Platform Changes</h2>
        <p>
          KBETZ may update, modify, remove, or limit features at any time,
          including odds feeds, AI picks, PRO tools, data panels, alerts, and
          dashboard functionality.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          KBETZ is provided as-is. KBETZ is not responsible for betting losses,
          missed opportunities, inaccurate data, delayed odds, third-party API
          failures, payment provider errors, or decisions made based on platform
          content.
        </p>

        <h2>7. Contact</h2>
        <p>
          For questions about these terms, contact KBETZ support at
          kenyadixon2021@gmail.com.
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
};
