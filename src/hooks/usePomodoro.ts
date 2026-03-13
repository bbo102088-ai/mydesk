"use client";

import { useEffect, useState } from "react";
import { logEvent } from "@/lib/analytics";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type PomodoroMode = "focus" | "break";

type PomodoroState = {
  isRunning: boolean;
  mode: PomodoroMode;
  remainingSeconds: number;
  completedSessions: number;
};

export function usePomodoro(): {
  state: PomodoroState;
  start: () => void;
  pause: () => void;
  reset: () => void;
} {
  const [state, setState] = useState<PomodoroState>({
    isRunning: false,
    mode: "focus",
    remainingSeconds: FOCUS_SECONDS,
    completedSessions: 0,
  });

  useEffect(() => {
    if (!state.isRunning) {
      return undefined;
    }

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.remainingSeconds > 1) {
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        }

        if (prev.mode === "focus") {
          logEvent("pomodoro_session_completed", {
            session: String(prev.completedSessions + 1),
          });
          return {
            isRunning: false,
            mode: "break",
            remainingSeconds: BREAK_SECONDS,
            completedSessions: prev.completedSessions + 1,
          };
        }

        return {
          ...prev,
          isRunning: false,
          mode: "focus",
          remainingSeconds: FOCUS_SECONDS,
        };
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [state.isRunning, state.mode]);

  const start = () => {
    setState((prev) => ({ ...prev, isRunning: true }));
  };

  const pause = () => {
    setState((prev) => ({ ...prev, isRunning: false }));
  };

  const reset = () => {
    setState({
      isRunning: false,
      mode: "focus",
      remainingSeconds: FOCUS_SECONDS,
      completedSessions: 0,
    });
  };

  return { state, start, pause, reset };
}

