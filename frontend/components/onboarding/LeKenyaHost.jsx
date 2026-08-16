"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_STEPS = [
  {
    id: "welcome",
    title: "Welcome to KBETZ",
    description:
      "I'm Le'Kenya, your KBETZ AI Guide. I'll show you the most important tools while keeping your dashboard completely visible.",
    audioSrc: "/audio/lekenya/welcome.mp3",
    target: null,
  },
  {
    id: "bankroll",
    title: "Your Bankroll",
    description:
      "Your bankroll tracks the amount you've personally chosen to set aside. KBETZ does not hold your money.",
    audioSrc: "/audio/lekenya/bankroll.mp3",
    selectors: ['[data-tour="bankroll"]'],
  },
  {
    id: "roi",
    title: "Performance & ROI",
    description:
      "Use this section to follow tracked wins, profit, win rate, and return on investment over time.",
    selectors: ['[data-tour="roi"]'],
  },
  {
    id: "ai-market-intelligence",
    title: "AI Market Intelligence",
    description:
      "This is your AI Market Intelligence center. KBETZ organizes genuine connected market information, confidence, edge, and risk signals to help you evaluate available opportunities. No prediction is guaranteed.",
    audioSrc: "/audio/lekenya/ai-market-intelligence.mp3",
    selectors: ['[data-tour="ai-picks"]'],
  },
  {
    id: "arbitrage",
    title: "Arbitrage",
    description:
      "Arbitrage compares available sportsbook pricing and highlights qualifying cross-book opportunities when genuine market differences are available.",
    selectors: ['[data-tour="arbitrage"]'],
  },
  {
    id: "steam",
    title: "Steam",
    description:
      "Steam helps you monitor meaningful line movement and market activity so you can see when pricing is changing across the board.",
    selectors: ['[data-tour="steam"]'],
  },
  {
    id: "parlay-builder",
    title: "Parlay Builder",
    description:
      "Use the Parlay Builder to combine selections, review combined odds, and see the projected payout before making a decision.",
    selectors: ['[data-tour="parlay-builder"]'],
  },
  {
    id: "history-tracker",
    title: "KBETZ AI Tracker",
    description:
      "The KBETZ AI Tracker keeps the saved pick record together, including pending picks, wins, losses, pushes, final scores, and tracked performance.",
    selectors: ['[data-tour="history-tracker"]'],
  },
  {
    id: "live-sports-board",
    title: "Live Sports Board",
    description:
      "This is your Live Sports Board. Explore available games, view connected sportsbook prices, and add selections to your parlay.",
    audioSrc: "/audio/lekenya/live-markets.mp3",
    selectors: ['[data-tour="live-markets"]'],
  },
  {
    id: "player-stats",
    title: "Player Stats",
    description:
      "Player Stats gives you another research layer for evaluating individual players and available statistical information.",
    selectors: [
      '[data-tour="player-stats"]',
      'a[href="/players"]',
      'a[href^="/players"]',
    ],
  },
  {
    id: "pro",
    title: "KBETZ PRO",
    description:
      "KBETZ PRO unlocks eligible premium intelligence and tools. Trial-eligible users can explore those features before deciding whether to subscribe.",
    audioSrc: "/audio/lekenya/free-trial.mp3",
    selectors: ['[data-tour="pro-features"]'],
  },
  {
    id: "finish",
    title: "You're Ready",
    description:
      "That's your KBETZ command center. Explore at your own pace, use the data responsibly, and replay this tour anytime.",
    audioSrc: "/audio/lekenya/finish.mp3",
    target: null,
  },
];

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function elementIsUsable(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();

  if (!rect.width || !rect.height) return false;

  const style = window.getComputedStyle(element);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity || 1) !== 0
  );
}

function findByText(matches = []) {
  const wanted = matches.map(normalize).filter(Boolean);

  if (!wanted.length) return null;

  const candidates = Array.from(
    document.querySelectorAll(
      [
        "button",
        "a",
        "section",
        "article",
        "[role='button']",
        "h1",
        "h2",
        "h3",
        "div",
      ].join(",")
    )
  );

  for (const candidate of candidates) {
    if (!elementIsUsable(candidate)) continue;

    const text = normalize(candidate.innerText);

    if (!text) continue;

    const match = wanted.some(
      (needle) =>
        text === needle ||
        text.startsWith(needle) ||
        text.includes(needle)
    );

    if (match) return candidate;
  }

  return null;
}

function resolveTarget(step) {
  if (!step) return null;

  const selectors = Array.isArray(step.selectors)
    ? step.selectors
    : step.targetSelector
      ? [step.targetSelector]
      : [];

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);

      if (element && elementIsUsable(element)) {
        return element;
      }
    } catch {}
  }

  return findByText(step.textMatches || []);
}

export default function LeKenyaHost({
  authEmail = "",
  steps = DEFAULT_STEPS,
}) {
  const safeEmail = normalize(authEmail);

  const storageKey = safeEmail
    ? `kbetz-lekenya-premium-tour:${safeEmail}`
    : "";

  const [phase, setPhase] = useState("loading");
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [hostSide, setHostSide] = useState("right");
  const [speaking, setSpeaking] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [presenterCompact, setPresenterCompact] = useState(false);

  const audioRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const autoAdvanceRef = useRef(null);

  const currentStep = steps[stepIndex] || steps[0] || null;

  const stopNarration = useCallback(() => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.onended = null;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}

      audioRef.current = null;
    }

    setSpeaking(false);
  }, []);

  const playNarration = useCallback(
    async (step) => {
      stopNarration();
      setAudioBlocked(false);

      // Le'Kenya uses ONLY her prerecorded voice.
      // Steps without a matching recording remain text-only,
      // but the guided tour continues automatically.
      if (!step?.audioSrc) {
        setSpeaking(false);

        const words = String(step?.description || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;

        const readingDelay = Math.max(
          4200,
          Math.min(8500, words * 115)
        );

        advanceTimerRef.current = window.setTimeout(() => {
          autoAdvanceRef.current?.();
        }, readingDelay);

        return;
      }

      try {
        const audio = new Audio(step.audioSrc);

        audio.preload = "auto";
        audioRef.current = audio;

        audio.onplay = () => {
          setSpeaking(true);
        };

        audio.onended = () => {
          setSpeaking(false);
          audioRef.current = null;

          advanceTimerRef.current = window.setTimeout(() => {
            autoAdvanceRef.current?.();
          }, 850);
        };

        audio.onerror = () => {
          setSpeaking(false);
          setAudioBlocked(true);
          audioRef.current = null;

          advanceTimerRef.current = window.setTimeout(() => {
            autoAdvanceRef.current?.();
          }, 4500);
        };

        await audio.play();
      } catch {
        setAudioBlocked(true);
        setSpeaking(false);

        advanceTimerRef.current = window.setTimeout(() => {
          autoAdvanceRef.current?.();
        }, 4500);
      }
    },
    [stopNarration]
  );

  const updateTarget = useCallback(() => {
    if (
      typeof window === "undefined" ||
      phase !== "tour"
    ) {
      setTargetRect(null);
      return;
    }

    const element = resolveTarget(currentStep);

    if (!element) {
      setTargetRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();

    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom,
    });

    const center = rect.left + rect.width / 2;

    setHostSide(
      center > window.innerWidth * 0.58
        ? "left"
        : "right"
    );
  }, [currentStep, phase]);

  const stepExists = useCallback(
    (index) => {
      const step = steps[index];

      if (!step) return false;

      if (
        step.target === null ||
        step.id === "welcome" ||
        step.id === "finish"
      ) {
        return true;
      }

      return Boolean(resolveTarget(step));
    },
    [steps]
  );

  const findAvailableStep = useCallback(
    (from, direction) => {
      const index = from + direction;

      if (index < 0 || index >= steps.length) {
        return null;
      }

      // Never silently skip a tour subject just because its
      // dashboard target is temporarily unavailable.
      return index;
    },
    [steps.length]
  );

  const markComplete = useCallback(() => {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, "true");
    } catch {}
  }, [storageKey]);

  const finishTour = useCallback(() => {
    stopNarration();
    markComplete();

    setPhase("finishing");

    window.setTimeout(() => {
      setPhase("finished");
    }, 420);
  }, [markComplete, stopNarration]);

  const next = useCallback(() => {
    stopNarration();

    const nextIndex = findAvailableStep(stepIndex, 1);

    if (nextIndex == null) {
      finishTour();
      return;
    }

    setStepIndex(nextIndex);
  }, [
    findAvailableStep,
    finishTour,
    stepIndex,
    stopNarration,
  ]);

  // Narration can safely advance without creating a
  // circular dependency inside playNarration().
  autoAdvanceRef.current = next;

  const previous = useCallback(() => {
    stopNarration();

    const previousIndex = findAvailableStep(stepIndex, -1);

    if (previousIndex == null) return;

    setStepIndex(previousIndex);
  }, [
    findAvailableStep,
    stepIndex,
    stopNarration,
  ]);

  const startTour = useCallback(() => {
    stopNarration();

    // Start with Le'Kenya's actual welcome/introduction.
    setStepIndex(0);
    setPhase("tour");
  }, [stopNarration]);

  const skipTour = useCallback(() => {
    stopNarration();
    markComplete();
    setPhase("finished");
  }, [markComplete, stopNarration]);

  const replayTour = useCallback(() => {
    stopNarration();
    setStepIndex(0);
    setPhase("welcome");
  }, [stopNarration]);

  useEffect(() => {
    if (!authEmail || !storageKey) return;

    try {
      const complete =
        localStorage.getItem(storageKey) === "true";

      setPhase(complete ? "finished" : "welcome");
    } catch {
      setPhase("welcome");
    }
  }, [authEmail, storageKey]);

  useEffect(() => {
    if (phase !== "tour") {
      setTargetRect(null);
      return;
    }

    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }

    const element = resolveTarget(currentStep);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    scrollTimerRef.current = window.setTimeout(() => {
      updateTarget();
      playNarration(currentStep);
    }, element ? 520 : 120);

    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, [
    currentStep,
    phase,
    playNarration,
    updateTarget,
  ]);

  useEffect(() => {
    if (phase !== "tour") return;

    const refresh = () => {
      window.requestAnimationFrame(updateTarget);
    };

    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);

    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [phase, updateTarget]);

  useEffect(() => {
    return () => {
      stopNarration();
    };
  }, [stopNarration]);

  useEffect(() => {
    // A new feature always brings Le'Kenya back into presenter mode.
    setPresenterCompact(false);

    // During an active tour Le'Kenya stays present.
    // Compact mode is only for idle/non-tour states.
    if (phase === "tour" || speaking) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPresenterCompact(true);
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phase, speaking, stepIndex]);

  const visibleSteps = useMemo(() => {
    return steps.filter((step, index) => {
      if (
        step.target === null ||
        step.id === "welcome" ||
        step.id === "finish"
      ) {
        return true;
      }

      if (phase !== "tour") return true;

      return stepExists(index);
    });
  }, [phase, stepExists, steps]);

  const progressIndex = Math.max(
    0,
    visibleSteps.findIndex(
      (step) => step.id === currentStep?.id
    )
  );

  if (phase === "loading" || !authEmail) return null;

  const isWelcome = phase === "welcome";
  const isTour = phase === "tour";
  const isFinishing = phase === "finishing";
  const isFinished = phase === "finished";

  return (
    <>
      <style jsx global>{`
        @keyframes kbetzLeKenyaFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes kbetzLeKenyaPulse {
          0% { transform: scale(0.92); opacity: 0.58; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(0.92); opacity: 0.58; }
        }

        @keyframes kbetzLeKenyaFadeIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes kbetzLeKenyaFadeOut {
          from { opacity: 1; }
          to {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
        }

        .kbetz-lekenya-host {
          animation: kbetzLeKenyaFadeIn 420ms ease both;
        }

        .kbetz-lekenya-portrait {
          animation: kbetzLeKenyaFloat 3.8s ease-in-out infinite;
        }

        .kbetz-lekenya-pointer {
          animation: kbetzLeKenyaPulse 1.4s ease-in-out infinite;
        }

        @keyframes kbetzPresenterSpeak {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          30% {
            transform: translateY(-2px) rotate(-0.8deg) scale(1.012);
          }
          65% {
            transform: translateY(1px) rotate(0.7deg) scale(1.008);
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }

        @keyframes kbetzPresenterGlow {
          0%, 100% {
            filter:
              saturate(1.04)
              drop-shadow(0 0 8px rgba(0,255,225,.12));
          }
          50% {
            filter:
              saturate(1.10)
              drop-shadow(0 0 18px rgba(0,255,225,.28));
          }
        }

        .kbetz-lekenya-portrait.is-speaking {
          animation:
            kbetzPresenterSpeak 1.45s ease-in-out infinite,
            kbetzPresenterGlow 2.1s ease-in-out infinite;
        }

        .kbetz-lekenya-portrait.face-left {
          transform-origin: 50% 90%;
        }

        .kbetz-lekenya-portrait.face-right {
          transform-origin: 50% 90%;
        }

        .kbetz-lekenya-host {
          transform-origin: bottom center;
        }

        @media (max-width: 760px) {
          .kbetz-lekenya-host {
            left: 12px !important;
            right: 12px !important;
            bottom: 72px !important;
            width: auto !important;
          }

          .kbetz-lekenya-portrait-wrap {
            width: 78px !important;
            min-width: 78px !important;
            height: 104px !important;
          }

          .kbetz-lekenya-description {
            max-height: 86px;
            overflow-y: auto;
          }
        }
      `}</style>

      {isTour && targetRect ? (
        <>
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: Math.max(8, targetRect.top - 9),
              left: Math.max(8, targetRect.left - 9),
              width: Math.max(20, targetRect.width + 18),
              height: Math.max(20, targetRect.height + 18),
              borderRadius: 18,
              border: "2px solid rgba(0,255,225,.82)",
              boxShadow:
                "0 0 18px rgba(0,255,225,.48), 0 0 36px rgba(124,58,237,.28), inset 0 0 22px rgba(0,255,225,.055)",
              pointerEvents: "none",
              zIndex: 8000,
              transition:
                "top .35s ease, left .35s ease, width .35s ease, height .35s ease",
            }}
          />

          <div
            className="kbetz-lekenya-pointer"
            aria-hidden="true"
            style={{
              position: "fixed",
              top: Math.max(20, targetRect.top - 28),
              left:
                hostSide === "right"
                  ? Math.max(20, targetRect.right - 14)
                  : Math.max(20, targetRect.left - 14),
              zIndex: 8001,
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg,#00ffe1,#8b5cf6)",
              color: "#020406",
              fontSize: 19,
              fontWeight: 1000,
              boxShadow:
                "0 0 24px rgba(0,255,225,.65)",
              pointerEvents: "none",
            }}
          >
            {hostSide === "right" ? "↙" : "↘"}
          </div>
        </>
      ) : null}

      {(isWelcome || isTour || isFinishing) && (
        <aside
          className="kbetz-lekenya-host"
          style={{
            position: "fixed",

            // Le'Kenya remains a stable live dashboard presenter.
            // The dashboard scrolls and the feature highlight moves;
            // the presenter herself does not chase targets around the page.
            bottom: 82,
            right: 22,
            left: "auto",
            top: "auto",

            width: presenterCompact ? 74 : 360,
            maxWidth: "calc(100vw - 28px)",

            transition:
              "top .42s cubic-bezier(.22,1,.36,1), left .42s cubic-bezier(.22,1,.36,1), width .35s ease, opacity .32s ease, transform .32s ease",

            zIndex: 9000,

            // The host itself is now visually transparent.
            // Le'Kenya + her speech panel are the visible presentation.
            border: "none",
            borderRadius: 24,
            padding: 0,
            color: "#fff",
            background: "transparent",
            boxShadow: "none",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            pointerEvents: "auto",
            animation: isFinishing
              ? "kbetzLeKenyaFadeOut 420ms ease forwards"
              : undefined,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div
              className="kbetz-lekenya-portrait-wrap"
              style={{
                position: "relative",
                width: presenterCompact ? 68 : 126,
                minWidth: presenterCompact ? 68 : 126,
                height: presenterCompact ? 68 : 184,
                borderRadius: 0,
                overflow: "visible",
                border: "none",
                background: "transparent",
                boxShadow: speaking
                  ? "0 12px 28px rgba(0,0,0,.18)"
                  : "none",
                transition:
                  "width .35s ease, min-width .35s ease, height .35s ease",
              }}
            >
              <img
                className={[
                  "kbetz-lekenya-portrait",
                  speaking ? "is-speaking" : "",
                  hostSide === "left" ? "face-right" : "face-left",
                ].join(" ")}
                src="/lekenya-kbetz-presenter.png"
                alt="Le'Kenya, KBETZ AI Guide"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                }}
              />


            </div>

            {!presenterCompact ? (
            <div
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,255,225,.16)",
                background: "rgba(3,10,15,.72)",
                boxShadow: "0 8px 20px rgba(0,0,0,.18)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#00ffe1",
                      fontSize: 10,
                      fontWeight: 1000,
                      letterSpacing: 1.5,
                    }}
                  >
                    LE&apos;KENYA
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      color: "#fff",
                      fontSize: 17,
                      fontWeight: 1000,
                    }}
                  >
                    {isWelcome
                      ? "Welcome to KBETZ"
                      : currentStep?.title}
                  </div>
                </div>

                {speaking ? (
                  <div
                    style={{
                      color: "#20ff7a",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    ● SPEAKING
                  </div>
                ) : null}
              </div>

              <p
                className="kbetz-lekenya-description"
                style={{
                  margin: "8px 0 0",
                  color: "rgba(255,255,255,.68)",
                  fontSize: 11,
                  lineHeight: 1.55,
                }}
              >
                {isWelcome
                  ? "I'm Le'Kenya, your KBETZ AI Guide. I'll stay right here while I guide you through the dashboard and highlight each feature."
                  : currentStep?.description}
              </p>

              {audioBlocked ? (
                <div
                  style={{
                    marginTop: 6,
                    color: "#ffcf4a",
                    fontSize: 9,
                  }}
                >
                  Le'Kenya's audio could not play for this step.
                </div>
              ) : null}
            </div>
            ) : null}
          </div>

          {!presenterCompact && isTour ? (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  marginBottom: 10,
                }}
              >
                {visibleSteps.map((step, index) => (
                  <div
                    key={step.id}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 99,
                      background:
                        index <= progressIndex
                          ? "linear-gradient(90deg,#00ffe1,#8b5cf6)"
                          : "rgba(255,255,255,.10)",
                      boxShadow:
                        index === progressIndex
                          ? "0 0 10px rgba(0,255,225,.38)"
                          : "none",
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.25fr",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={previous}
                  disabled={
                    findAvailableStep(stepIndex, -1) == null
                  }
                  style={{
                    minHeight: 38,
                    borderRadius: 11,
                    border:
                      "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.045)",
                    color: "#fff",
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={next}
                  style={{
                    minHeight: 38,
                    borderRadius: 11,
                    border:
                      "1px solid rgba(0,255,225,.38)",
                    background:
                      "linear-gradient(135deg,rgba(0,255,225,.20),rgba(139,92,246,.20))",
                    color: "#fff",
                    fontWeight: 1000,
                    cursor: "pointer",
                    boxShadow:
                      "0 0 18px rgba(0,255,225,.11)",
                  }}
                >
                  {currentStep?.id === "finish"
                    ? "Finish"
                    : "Next →"}
                </button>
              </div>

              <button
                type="button"
                onClick={skipTour}
                style={{
                  width: "100%",
                  marginTop: 8,
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,.42)",
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Skip Tour
              </button>
            </div>
          ) : null}

          {!presenterCompact && isWelcome ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.35fr .85fr",
                gap: 8,
                marginTop: 12,
              }}
            >
              <button
                type="button"
                onClick={startTour}
                style={{
                  minHeight: 40,
                  borderRadius: 11,
                  border:
                    "1px solid rgba(0,255,225,.40)",
                  background:
                    "linear-gradient(135deg,rgba(0,255,225,.20),rgba(139,92,246,.20))",
                  color: "#fff",
                  fontWeight: 1000,
                  cursor: "pointer",
                }}
              >
                Start Guided Tour
              </button>

              <button
                type="button"
                onClick={skipTour}
                style={{
                  minHeight: 40,
                  borderRadius: 11,
                  border:
                    "1px solid rgba(255,255,255,.10)",
                  background: "rgba(255,255,255,.035)",
                  color: "rgba(255,255,255,.64)",
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                Explore
              </button>
            </div>
          ) : null}
        </aside>
      )}

      {isFinished ? (
        <button
          type="button"
          onClick={replayTour}
          title="Replay Le'Kenya's KBETZ tour"
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 8500,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid rgba(0,255,225,.28)",
            background:
              "linear-gradient(135deg,rgba(5,18,22,.94),rgba(20,8,34,.94))",
            color: "#00ffe1",
            fontSize: 10,
            fontWeight: 1000,
            letterSpacing: 0.4,
            cursor: "pointer",
            boxShadow: "0 0 22px rgba(0,255,225,.10)",
            backdropFilter: "blur(12px)",
          }}
        >
          ✦ Replay Tour
        </button>
      ) : null}
    </>
  );
}
