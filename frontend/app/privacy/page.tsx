export default function PrivacyPage() {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.logo}>KBETZ Privacy Policy</h1>
        <p style={styles.updated}>Last updated: 2026</p>

        <p>
          This Privacy Policy explains how KBETZ handles information when you
          use the platform.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          KBETZ may collect account information such as your email address,
          login information, subscription status, app usage activity, and basic
          technical information such as device type, browser, and error logs.
        </p>

        <h2>2. Payments</h2>
        <p>
          KBETZ does not directly store full credit card details. Payments and
          billing may be processed by Stripe or another third-party payment
          provider. Their privacy and security policies apply to payment data.
        </p>

        <h2>3. How Information Is Used</h2>
        <p>
          KBETZ may use information to create accounts, provide dashboard access,
          manage PRO subscriptions, improve app performance, prevent abuse,
          troubleshoot issues, and communicate important updates.
        </p>

        <h2>4. Betting Data</h2>
        <p>
          KBETZ is an analytics platform and does not place wagers or accept
          deposits. Any betting decisions users make outside KBETZ are their own
          responsibility.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>
          KBETZ may use third-party services for hosting, payments, analytics,
          odds data, authentication, and app infrastructure. These providers may
          process limited information needed to operate the platform.
        </p>

        <h2>6. Data Security</h2>
        <p>
          KBETZ uses reasonable safeguards to protect user information, but no
          online service can guarantee complete security.
        </p>

        <h2>7. Contact</h2>
        <p>
          For privacy questions, contact KBETZ support at
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
