"use client";

export default function SectionHeader({
  eyebrow,
  title,
  subtitle = "",
  action = null,
  style = {},
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 18,
        ...style,
      }}
    >
      <div>
        {eyebrow ? (
          <div
            style={{
              color: "#00ffe1",
              fontSize: 11,
              fontWeight: 1000,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <h2
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "clamp(24px,3vw,34px)",
            fontWeight: 1000,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "8px 0 0",
              color: "rgba(255,255,255,.58)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}
