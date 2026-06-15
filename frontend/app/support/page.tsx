export default function SupportPage() {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.logo}>KBETZ Support</h1>
        <p style={styles.updated}>We’re here to help.</p>

        <h2>Contact</h2>
        <p>
          For account help, billing questions, signup/login issues, PRO access,
          or dashboard problems, contact:
        </p>

        <div style={styles.emailBox}>kenyadixon2021@gmail.com</div>

        <h2>What to Include</h2>
        <p>
          Please include your KBETZ account email, the device you are using,
          whether you are on iPhone, Android, or desktop, and a screenshot if
          something does not look right.
        </p>

        <h2>Billing</h2>
        <p>
          KBETZ PRO billing is handled through Stripe or another payment
          processor. KBETZ does not accept sportsbook deposits or wagers.
        </p>

        <h2>Helpful Links</h2>
        <div style={styles.links}>
          <a href="/terms" style={styles.link}>Terms</a>
          <a href="/privacy" style={styles.link}>Privacy</a>
          <a href="/responsible-gambling" style={styles.link}>Responsible Gambling</a>
          <a href="/signup" style={styles.link}>Signup</a>
          <a href="/login" style={styles.link}>Login</a>
        </div>
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
  emailBox: {
    padding: 18,
    borderRadius: 14,
    border: "1px solid rgba(0,255,214,.45)",
    background: "rgba(0,255,214,.08)",
    color: "#00ffd6",
    fontWeight: 1000,
    margin: "14px 0 26px",
    wordBreak: "break-word",
  },
  links: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  link: {
    color: "#00ffd6",
    textDecoration: "none",
    border: "1px solid rgba(0,255,214,.4)",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 900,
  },
};
