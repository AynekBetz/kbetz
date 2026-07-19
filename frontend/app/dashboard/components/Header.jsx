"use client";

export default function Header() {
  const styles = {
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },

    logoLeft: {
      fontSize: 44,
      fontWeight: 950,
      fontStyle: "italic",
      letterSpacing: 1,
      background:
        "linear-gradient(90deg,#8b5cf6 0%,#00ffe1 47%,#a855f7 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow:
        "0 0 20px rgba(0,255,225,.65),0 0 42px rgba(124,58,237,.45)",
    },

    logoTerminal: {
      marginLeft: 14,
      fontSize: 34,
      color: "#00eaff",
      WebkitTextFillColor: "#00eaff",
      textShadow: "0 0 18px rgba(0,255,225,.65)",
    },

    logoRight: {
      fontSize: 44,
      fontWeight: 950,
      fontStyle: "italic",
      letterSpacing: 1,
      background:
        "linear-gradient(90deg,#00ffe1 0%,#795cff 52%,#ff3df2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow:
        "0 0 22px rgba(0,255,225,.65),0 0 44px rgba(255,61,242,.5)",
    },
  };

  return (
    <header style={styles.header}>
      <div style={styles.logoLeft}>
        KBETZ
        <span style={styles.logoTerminal}>TERMINAL</span>
      </div>

      <div style={styles.logoRight}>
        KBETZ
      </div>
    </header>
  );
}
