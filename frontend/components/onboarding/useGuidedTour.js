"use client";

import { useCallback, useMemo, useState } from "react";

export default function useGuidedTour({
  steps = [],
  initialStep = 0,
  onComplete,
  onSkip,
} = {}) {
  const safeSteps = Array.isArray(steps) ? steps : [];

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(() =>
    Math.min(
      Math.max(Number(initialStep) || 0, 0),
      Math.max(safeSteps.length - 1, 0)
    )
  );

  const totalSteps = safeSteps.length;

  const currentStep = useMemo(() => {
    return safeSteps[stepIndex] || null;
  }, [safeSteps, stepIndex]);

  const isFirstStep = stepIndex <= 0;
  const isLastStep =
    totalSteps > 0 && stepIndex >= totalSteps - 1;

  const openTour = useCallback((startAt = 0) => {
    const nextIndex = Math.min(
      Math.max(Number(startAt) || 0, 0),
      Math.max(totalSteps - 1, 0)
    );

    setStepIndex(nextIndex);
    setIsOpen(true);
  }, [totalSteps]);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    if (!totalSteps) {
      setIsOpen(false);
      return;
    }

    if (stepIndex >= totalSteps - 1) {
      setIsOpen(false);
      onComplete?.();
      return;
    }

    setStepIndex((current) =>
      Math.min(current + 1, totalSteps - 1)
    );
  }, [onComplete, stepIndex, totalSteps]);

  const previousStep = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const goToStep = useCallback(
    (index) => {
      const nextIndex = Math.min(
        Math.max(Number(index) || 0, 0),
        Math.max(totalSteps - 1, 0)
      );

      setStepIndex(nextIndex);
    },
    [totalSteps]
  );

  const skipTour = useCallback(() => {
    setIsOpen(false);
    onSkip?.();
  }, [onSkip]);

  const resetTour = useCallback(() => {
    setStepIndex(0);
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    stepIndex,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    openTour,
    closeTour,
    nextStep,
    previousStep,
    goToStep,
    skipTour,
    resetTour,
  };
}
