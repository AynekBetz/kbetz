"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import WelcomeModal from "../../components/onboarding/WelcomeModal";
import GuidedTour from "../../components/onboarding/GuidedTour";
import TourOverlay from "../../components/onboarding/TourOverlay";
import useGuidedTour from "../../components/onboarding/useGuidedTour";
import useLeKenyaNarration from "../../components/onboarding/useLeKenyaNarration";

const TOUR_STEPS = [
  {
    title: "Welcome to KBETZ",
    description:
      "Hello! I'm Le'kenya, your KBETZ AI Guide. I'll show you the most important parts of the platform one step at a time.",
    targetSelector: "[data-tour='welcome']",
  },
  {
    title: "Live Markets",
    audioSrc: "/audio/lekenya/live-markets.mp3",
    description:
      "This is where available games and market information appear. Schedule-only games remain clearly labeled until genuine sportsbook odds are available.",
    targetSelector: "[data-tour='live-markets']",
  },
  {
    title: "AI Market Intelligence",
    audioSrc: "/audio/lekenya/ai-market-intelligence.mp3",
    description:
      "When real sportsbook prices are available, KBETZ can organize confidence, edge, and risk information to help you evaluate a market. No prediction is guaranteed.",
    targetSelector: "[data-tour='ai-picks']",
  },
  {
    title: "Your Bankroll",
    description:
      "Your bankroll is the amount you've personally set aside for betting. KBETZ does not hold your money—it helps you track your results and performance.",
    targetSelector: "[data-tour='bankroll']",
  },
  {
    title: "Mission Control",
    description:
      "Mission Control shows platform health, database status, data-provider readiness, and other operational information behind KBETZ.",
    targetSelector: "[data-tour='mission-control']",
    audioSrc: "/audio/lekenya/mission-control.mp3",
  },
  {
    title: "Your 7-Day FREE Trial",
    description:
      "During your trial, eligible PRO tools are unlocked so you can explore the premium experience before deciding whether to subscribe.",
    targetSelector: "[data-tour='trial']",
  },
  {
    title: "You're Ready",
    description:
      "Thank you for choosing KBETZ. I'm excited to be part of your journey. Good luck—and welcome to the KBETZ family.",
    targetSelector: "[data-tour='finish']",
  },
];

function PreviewCard({
  tourId,
  eyebrow,
  title,
  description,
  value,
  accent = "#00ffe1",
}) {
  return (
    <section
      data-tour={tourId}
      style={{
        position: "relative",
        minHeight: 210,
        padding: 22,
        overflow: "hidden",
        borderRadius: 20,
        border: `1px solid ${accent}38`,
        background:
          "radial-gradient(circle at top right, rgba(196,45,255,.09), transparent 35%), " +
          "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.018))",
        boxShadow:
          `0 0 26px ${accent}12, inset 0 0 28px rgba(255,255,255,.018)`,
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: 10,
          fontWeight: 1000,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>

      <h2
        style={{
          margin: "10px 0 0",
          color: "#ffffff",
          fontSize: 23,
        }}
      >
        {title}
      </h2>

      {value ? (
        <div
          style={{
            marginTop: 18,
            color: accent,
            fontSize: 38,
            fontWeight: 1000,
            textShadow: `0 0 18px ${accent}66`,
          }}
        >
          {value}
        </div>
      ) : null}

      <p
        style={{
          margin: "14px 0 0",
          maxWidth: 480,
          color: "rgba(255,255,255,.57)",
          fontSize: 13,
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>
    </section>
  );
}

export default function OnboardingPreviewPage() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [firstName, setFirstName] = useState("Kenya");
  const [tourFinished, setTourFinished] = useState(false);

  const welcomeAudioRef = useRef(null);
  const tourAudioRef = useRef(null);

  const {
    enabled: voiceEnabled,
    speaking,
    supported: voiceSupported,
    voiceName,
    speak,
    stop,
    toggle: toggleVoice,
  } = useLeKenyaNarration({
    enabledByDefault: true,
    rate: 0.92,
    pitch: 1.02,
    volume: 1,
  });

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const queryName = parameters.get("name");

    const storedName =
      window.localStorage.getItem("kbetzFirstName") || "";

    const selectedName = String(
      queryName || storedName || "Kenya"
    ).trim();

    setFirstName(selectedName || "Kenya");
  }, []);

  const {
    isOpen,
    stepIndex,
    currentStep,
    totalSteps,
    openTour,
    nextStep,
    previousStep,
    skipTour,
    resetTour,
  } = useGuidedTour({
    steps: TOUR_STEPS,
    onComplete: () => {
      setTourFinished(true);
    },
    onSkip: () => {
      setTourFinished(true);
    },
  });

  const greeting = useMemo(() => {
    return firstName ? `Hello, ${firstName}.` : "Hello.";
  }, [firstName]);

  const narratedDescription = useMemo(() => {
    const description = currentStep?.description || "";

    return stepIndex === 0
      ? `${greeting} ${description}`
      : description;
  }, [currentStep?.description, greeting, stepIndex]);

  useEffect(() => {
    if (!isOpen || !narratedDescription) {
      return;
    }

    stop();

    if (tourAudioRef.current) {
      tourAudioRef.current.pause();
      tourAudioRef.current.currentTime = 0;
      tourAudioRef.current = null;
    }

    const timer = window.setTimeout(() => {
      if (currentStep?.audioSrc) {
        const audio = new Audio(currentStep.audioSrc);

        audio.preload = "auto";
        tourAudioRef.current = audio;

        audio.play().catch((error) => {
          console.warn(
            "Le'kenya professional narration could not start:",
            error
          );
        });

        return;
      }

      speak(narratedDescription);
    }, 320);

    return () => {
      window.clearTimeout(timer);
      stop();

      if (tourAudioRef.current) {
        tourAudioRef.current.pause();
        tourAudioRef.current.currentTime = 0;
        tourAudioRef.current = null;
      }
    };
  }, [
    isOpen,
    currentStep?.audioSrc,
    narratedDescription,
    speak,
    stop,
  ]);

  const startTour = () => {
    stop();

    if (welcomeAudioRef.current) {
      welcomeAudioRef.current.pause();
      welcomeAudioRef.current.currentTime = 0;
    }

    setShowWelcome(false);
    setTourFinished(false);

    window.setTimeout(() => {
      openTour(0);
    }, 180);
  };

  const exploreAlone = () => {
    stop();
    setShowWelcome(false);
    setTourFinished(false);
  };

  const replayTour = () => {
    stop();

    if (welcomeAudioRef.current) {
      welcomeAudioRef.current.pause();
      welcomeAudioRef.current.currentTime = 0;
    }

    resetTour();
    setTourFinished(false);
    setShowWelcome(true);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(18px, 4vw, 42px)",
        color: "#ffffff",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        background:
          "radial-gradient(circle at 8% 5%, rgba(0,255,225,.16), transparent 28%), " +
          "radial-gradient(circle at 92% 4%, rgba(196,45,255,.25), transparent 32%), " +
          "linear-gradient(180deg, #02070a 0%, #06020b 48%, #000000 100%)",
      }}
    >
      <audio
        ref={welcomeAudioRef}
        src="/audio/lekenya/welcome.mp3"
        preload="auto"
      />

      <WelcomeModal
        open={showWelcome}
        firstName={firstName}
        onStartTour={startTour}
        onSkip={exploreAlone}
      />

      <TourOverlay
        open={isOpen}
        targetSelector={currentStep?.targetSelector || ""}
      />

      <GuidedTour
        open={isOpen}
        currentStep={{
          ...currentStep,
          description: narratedDescription,
        }}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipTour}
      />

      <header
        data-tour="welcome"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 28,
          padding: 22,
          borderRadius: 22,
          border: "1px solid rgba(0,255,225,.2)",
          background:
            "linear-gradient(135deg, rgba(0,255,225,.055), rgba(196,45,255,.065))",
          boxShadow:
            "0 0 34px rgba(0,255,225,.07), inset 0 0 30px rgba(196,45,255,.035)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "clamp(34px, 6vw, 64px)",
              lineHeight: 1,
              fontWeight: 1000,
              letterSpacing: -2,
              background:
                "linear-gradient(90deg, #00ffe1 0%, #35d7ff 30%, #8b5cf6 66%, #ff49d8 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            KBETZ
          </div>

          <div
            style={{
              marginTop: 9,
              color: "rgba(255,255,255,.56)",
              fontSize: 13,
            }}
          >
            Private Onboarding Experience Lab
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (!welcomeAudioRef.current) return;

              stop();
              welcomeAudioRef.current.currentTime = 0;

              welcomeAudioRef.current.play().catch(() => {});
            }}
            style={{
              padding: "12px 17px",
              borderRadius: 13,
              border: "1px solid rgba(0,255,225,.34)",
              background:
                "linear-gradient(135deg, rgba(0,255,225,.14), rgba(53,215,255,.08))",
              color: "#00ffe1",
              fontWeight: 1000,
              cursor: "pointer",
            }}
          >
            ▶ Hear Le&apos;kenya
          </button>

          <button
            type="button"
            onClick={toggleVoice}
            disabled={!voiceSupported}
            title={
              voiceSupported
                ? `Narration voice: ${voiceName || "Loading"}`
                : "Narration is unavailable in this browser"
            }
            style={{
              padding: "12px 17px",
              borderRadius: 13,
              border: voiceEnabled
                ? "1px solid rgba(0,255,225,.34)"
                : "1px solid rgba(255,255,255,.14)",
              background: voiceEnabled
                ? "linear-gradient(135deg, rgba(0,255,225,.14), rgba(53,215,255,.08))"
                : "rgba(255,255,255,.04)",
              color: voiceEnabled
                ? "#00ffe1"
                : "rgba(255,255,255,.55)",
              fontWeight: 1000,
              cursor: voiceSupported ? "pointer" : "not-allowed",
            }}
          >
            {speaking
              ? "🔊 Le'kenya Speaking"
              : voiceEnabled
                ? "🔊 Voice On"
                : "🔇 Voice Off"}
          </button>

          <button
            type="button"
            onClick={replayTour}
            style={{
              padding: "12px 17px",
            borderRadius: 13,
            border: "1px solid rgba(0,255,225,.28)",
            background:
              "linear-gradient(135deg, rgba(0,255,225,.12), rgba(124,58,237,.11))",
            color: "#00ffe1",
            fontWeight: 1000,
            cursor: "pointer",
          }}
        >
            Replay Welcome
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 18,
        }}
      >
        <PreviewCard
          tourId="live-markets"
          eyebrow="Live Board"
          title="Live Markets"
          value="24"
          accent="#00ffe1"
          description="Preview of real games and available market information."
        />

        <PreviewCard
          tourId="ai-picks"
          eyebrow="Intelligence"
          title="AI Market Intelligence"
          value="Ready"
          accent="#c86cff"
          description="Verified analysis appears only when genuine sportsbook prices are available."
        />

        <PreviewCard
          tourId="bankroll"
          eyebrow="Performance"
          title="Bankroll"
          value="$500"
          accent="#00ff99"
          description="An example amount personally set aside for tracking wagers and results."
        />

        <PreviewCard
          tourId="mission-control"
          eyebrow="Operations"
          title="Mission Control"
          value="Online"
          accent="#7ca8ff"
          description="Platform health, provider readiness, and operational visibility."
        />

        <PreviewCard
          tourId="trial"
          eyebrow="Membership"
          title="7-Day FREE Trial"
          value="7 Days"
          accent="#ffd166"
          description="A clear preview of eligible KBETZ PRO features before subscribing."
        />

        <PreviewCard
          tourId="finish"
          eyebrow="Welcome"
          title="Enter KBETZ"
          value="Ready"
          accent="#ff72d5"
          description="Finish the walkthrough and begin exploring the platform."
        />
      </div>

      {tourFinished ? (
        <section
          style={{
            marginTop: 24,
            padding: 24,
            textAlign: "center",
            borderRadius: 20,
            border: "1px solid rgba(0,255,225,.24)",
            background:
              "linear-gradient(135deg, rgba(0,255,225,.07), rgba(196,45,255,.08))",
          }}
        >
          <div
            style={{
              color: "#ffffff",
              fontSize: 25,
              fontWeight: 1000,
            }}
          >
            You’re all set, {firstName}.
          </div>

          <p
            style={{
              margin: "9px auto 0",
              maxWidth: 600,
              color: "rgba(255,255,255,.58)",
              lineHeight: 1.65,
            }}
          >
            Le&apos;kenya will be available whenever you need help
            understanding KBETZ.
          </p>

          <button
            type="button"
            onClick={replayTour}
            style={{
              marginTop: 16,
              padding: "12px 18px",
              borderRadius: 13,
              border: "1px solid rgba(0,255,225,.28)",
              background:
                "linear-gradient(90deg, rgba(0,255,225,.16), rgba(124,58,237,.16))",
              color: "#ffffff",
              fontWeight: 1000,
              cursor: "pointer",
            }}
          >
            Watch the Welcome Again
          </button>
        </section>
      ) : null}
    </main>
  );
}
