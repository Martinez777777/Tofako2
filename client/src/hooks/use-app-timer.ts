import { useEffect, useState } from "react";

export function useAppTimer() {
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTimerAndStart() {
      try {
        const response = await fetch("/api/timer");
        const data = await response.json();
        const minutes = data.minutes || 0;

        if (minutes <= 0) {
          console.warn("Timer is disabled or invalid");
          return;
        }

        setMinutesRemaining(minutes);
        
        // Convert minutes to milliseconds and start countdown
        const totalMilliseconds = minutes * 60 * 1000;
        const startTime = Date.now();

        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = totalMilliseconds - elapsed;

          if (remaining <= 0) {
            clearInterval(interval);
            // Close the app
            window.close();
            // Fallback if window.close() doesn't work
            setTimeout(() => {
              window.location.href = "about:blank";
            }, 1000);
          } else {
            const remainingMinutes = Math.ceil(remaining / 1000 / 60);
            setMinutesRemaining(remainingMinutes);
          }
        }, 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Failed to fetch timer:", error);
      }
    }

    fetchTimerAndStart();
  }, []);

  return { minutesRemaining };
}
