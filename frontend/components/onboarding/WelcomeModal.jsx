"use client";

import GlassCard from "../ui/GlassCard";
import GlowButton from "../ui/GlowButton";
import StatusBadge from "../ui/StatusBadge";

const trialFeatures = [
  "AI Market Intelligence",
  "AI Parlay Builder",
  "Mission Control",
  "Bankroll Tracking",
  "Live Alerts",
  "Advanced Analytics",
];

export default function WelcomeModal({
  open = true,
  imageSrc = "",
  firstName = "",
  onStartTour,
  onSkip,
}) {
  const safeFirstName = String(firstName || "").trim();
  const personalGreeting = safeFirstName
    ? `Hello, ${safeFirstName}.`
    : "Hello.";
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbetz-welcome-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: 18,
        overflowY: "auto",
        background:
          "radial-gradient(circle at 15% 10%, rgba(0,255,225,.16), transparent 28%), radial-gradient(circle at 85% 8%, rgba(196,45,255,.24), transparent 34%), rgba(0,2,5,.91)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <GlassCard
        glow="mixed"
        hover={false}
        style={{
          width: "min(1080px, 100%)",
          padding: "clamp(18px, 3vw, 34px)",
          border: "1px solid rgba(0,255,225,.32)",
          boxShadow:
            "0 0 60px rgba(0,255,225,.1), 0 0 85px rgba(196,45,255,.1)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: "12%",
            right: "12%",
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #00ffe1, #8b5cf6, #ff49d8, transparent)",
            boxShadow:
              "0 0 18px rgba(0,255,225,.75), 0 0 30px rgba(196,45,255,.45)",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "clamp(22px, 4vw, 42px)",
            alignItems: "center",
          }}
        >
          <section>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: "clamp(34px, 6vw, 58px)",
                  fontWeight: 1000,
                  letterSpacing: -2,
                  lineHeight: 1,
                  background:
                    "linear-gradient(90deg, #00ffe1 0%, #35d7ff 32%, #946bff 66%, #ff49d8 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 0 30px rgba(0,255,225,.16)",
                }}
              >
                KBETZ
              </div>

              <StatusBadge
                label="7-Day PRO Trial"
                status="online"
              />
            </div>

            <h1
              id="kbetz-welcome-title"
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "clamp(29px, 4vw, 47px)",
                lineHeight: 1.04,
                fontWeight: 1000,
                letterSpacing: -1,
              }}
            >
              Welcome to your
              <span
                style={{
                  display: "block",
                  marginTop: 5,
                  background:
                    "linear-gradient(90deg, #00ffe1, #8b5cf6, #ff49d8)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                KBETZ experience
              </span>
            </h1>

            <p
              style={{
                margin: "17px 0 0",
                color: "rgba(255,255,255,.68)",
                fontSize: 15,
                lineHeight: 1.75,
              }}
            >
              <strong style={{ color: "#ffffff" }}>
                {personalGreeting}
              </strong>{" "}
              Meet Le&apos;kenya, your KBETZ AI Guide. She will show
              you how to explore games, understand AI insights, track
              your bankroll, and get the most from your free trial.
            </p>

            <div
              style={{
                marginTop: 22,
                border: "1px solid rgba(0,255,225,.18)",
                borderRadius: 16,
                padding: 16,
                background:
                  "linear-gradient(135deg, rgba(0,255,225,.055), rgba(196,45,255,.055))",
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 1000,
                }}
              >
                🎁 Your 7-Day FREE Trial
              </div>

              <p
                style={{
                  margin: "7px 0 14px",
                  color: "rgba(255,255,255,.55)",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Explore the full KBETZ PRO experience before deciding
                whether to subscribe.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 9,
                }}
              >
                {trialFeatures.map((feature) => (
                  <div
                    key={feature}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "rgba(255,255,255,.78)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        color: "#00ff99",
                        textShadow: "0 0 10px rgba(0,255,153,.7)",
                      }}
                    >
                      ✓
                    </span>

                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div
              style={{
                position: "relative",
                minHeight: 440,
                display: "grid",
                alignItems: "end",
                overflow: "hidden",
                border: "1px solid rgba(196,45,255,.25)",
                borderRadius: 22,
                background:
                  "radial-gradient(circle at 50% 18%, rgba(0,255,225,.22), transparent 27%), radial-gradient(circle at 70% 30%, rgba(196,45,255,.28), transparent 36%), linear-gradient(180deg, #07161b 0%, #10051d 56%, #030308 100%)",
                boxShadow:
                  "0 0 34px rgba(0,255,225,.09), inset 0 0 38px rgba(196,45,255,.06)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.25,
                  backgroundImage:
                    "linear-gradient(rgba(0,255,225,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,225,.16) 1px, transparent 1px)",
                  backgroundSize: "38px 38px",
                  maskImage:
                    "linear-gradient(to bottom, black, transparent 82%)",
                }}
              />

              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Le'kenya, the KBETZ AI guide"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    height: 440,
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    placeItems: "center",
                    minHeight: 440,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      width: 185,
                      height: 185,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      border: "2px solid rgba(0,255,225,.45)",
                      background:
                        "linear-gradient(145deg, rgba(0,255,225,.15), rgba(196,45,255,.22))",
                      color: "#ffffff",
                      fontSize: 68,
                      fontWeight: 1000,
                      boxShadow:
                        "0 0 38px rgba(0,255,225,.2), 0 0 70px rgba(196,45,255,.16)",
                    }}
                  >
                    LK
                  </div>
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  zIndex: 2,
                  left: 16,
                  right: 16,
                  bottom: 16,
                  padding: 16,
                  border: "1px solid rgba(0,255,225,.2)",
                  borderRadius: 15,
                  background: "rgba(1,7,12,.78)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 21,
                    fontWeight: 1000,
                  }}
                >
                  Le&apos;kenya
                </div>

                <div
                  style={{
                    marginTop: 3,
                    color: "#00ffe1",
                    fontSize: 10,
                    fontWeight: 1000,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                  }}
                >
                  AI Guide • KBETZ
                </div>

                <p
                  style={{
                    margin: "9px 0 0",
                    color: "rgba(255,255,255,.65)",
                    fontSize: 12,
                    lineHeight: 1.55,
                  }}
                >
                  “I&apos;ll guide you one step at a time. Whenever you
                  need help, I&apos;ll be right here.”
                </p>
              </div>
            </div>
          </section>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 26,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              color: "rgba(255,255,255,.42)",
              fontSize: 10,
              lineHeight: 1.55,
            }}
          >
            KBETZ provides analytics and educational information. No
            outcome is guaranteed. You must be 21 or older and follow
            the laws in your location.
          </div>

          <div
            style={{
              display: "flex",
              gap: 11,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={onSkip}
              style={{
                padding: "11px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.16)",
                background: "rgba(255,255,255,.045)",
                color: "rgba(255,255,255,.75)",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Explore on My Own
            </button>

            <GlowButton
              onClick={onStartTour}
              color="#00ffe1"
              style={{
                padding: "12px 20px",
              }}
            >
              Start Guided Tour →
            </GlowButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
