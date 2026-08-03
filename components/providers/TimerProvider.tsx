"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface TimerContextType {
  isActive: boolean;
  timeElapsed: number; // in seconds
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dsa_tracker_focus_timer");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isActive) {
          // Calculate how much time passed while away
          const now = Date.now();
          const diffSeconds = Math.floor((now - parsed.lastUpdated) / 1000);
          setTimeElapsed(parsed.timeElapsed + diffSeconds);
          setIsActive(true);
        } else {
          setTimeElapsed(parsed.timeElapsed);
          setIsActive(false);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 1;
          localStorage.setItem(
            "dsa_tracker_focus_timer",
            JSON.stringify({ isActive: true, timeElapsed: next, lastUpdated: Date.now() })
          );
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const startTimer = () => setIsActive(true);

  const pauseTimer = () => {
    setIsActive(false);
    localStorage.setItem(
      "dsa_tracker_focus_timer",
      JSON.stringify({ isActive: false, timeElapsed, lastUpdated: Date.now() })
    );
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimeElapsed(0);
    localStorage.removeItem("dsa_tracker_focus_timer");
  };

  return (
    <TimerContext.Provider value={{ isActive, timeElapsed, startTimer, pauseTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used within a TimerProvider");
  return context;
}
