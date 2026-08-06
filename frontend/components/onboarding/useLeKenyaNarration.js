"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function chooseVoice(voices = []) {
  const preferred = [
    "aria",
    "jenny",
    "ava",
    "samantha",
    "zira",
    "victoria",
    "google us english",
  ];

  const englishVoices = voices.filter((voice) =>
    String(voice?.lang || "").toLowerCase().startsWith("en")
  );

  for (const name of preferred) {
    const match = englishVoices.find((voice) =>
      String(voice?.name || "").toLowerCase().includes(name)
    );

    if (match) return match;
  }

  return englishVoices[0] || voices[0] || null;
}

export default function useLeKenyaNarration({
  enabledByDefault = true,
  rate = 0.92,
  pitch = 1.02,
  volume = 1,
} = {}) {
  const [enabled, setEnabled] = useState(enabledByDefault);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voiceName, setVoiceName] = useState("");

  const voiceRef = useRef(null);

  const loadVoices = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const voices = window.speechSynthesis.getVoices();
    const selected = chooseVoice(voices);

    voiceRef.current = selected;
    setVoiceName(selected?.name || "");
  }, []);

  useEffect(() => {
    loadVoices();

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return undefined;
    }

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      window.speechSynthesis.cancel();

      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );
    };
  }, [loadVoices]);

  const stop = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (message) => {
      const text = String(message || "").trim();

      if (
        !enabled ||
        !text ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current?.lang || "en-US";
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [enabled, pitch, rate, volume]
  );

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current;

      if (!next) {
        stop();
      }

      return next;
    });
  }, [stop]);

  return {
    enabled,
    speaking,
    supported,
    voiceName,
    speak,
    stop,
    toggle,
  };
}
