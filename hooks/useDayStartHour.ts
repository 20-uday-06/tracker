import { useState, useEffect } from "react";

const STORAGE_KEY = "dsa_tracker_day_start_hour";
const DEFAULT_HOUR = 5;

/**
 * Hook that reads/writes the user's preferred "day start hour" from localStorage.
 * When the current time is before this hour, it's still counted as "yesterday's" study day.
 * Default: 5 (5 AM) — good for night-owls who study until ~4 AM.
 */
export function useDayStartHour() {
  const [hour, setHourState] = useState<number>(DEFAULT_HOUR);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setHourState(parseInt(stored));
    }
    setLoaded(true);
  }, []);

  const setHour = (h: number) => {
    localStorage.setItem(STORAGE_KEY, String(h));
    setHourState(h);
  };

  return { hour, setHour, loaded };
}
