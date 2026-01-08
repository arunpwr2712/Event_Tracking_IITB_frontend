import { useEffect, useState, useRef } from "react";

// Timer supports server-provided `remainingSeconds` (authoritative) or the legacy `expectedExit`.
export default function Timer({ expectedExit, remainingSeconds = null, alertOnWarn = false, onTimeUp }) {
  // remainingSeconds: number (seconds) from server
  const [remainingSec, setRemainingSec] = useState(remainingSeconds === null ? null : remainingSeconds);
  const [warned, setWarned] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (remainingSeconds !== null && remainingSeconds !== undefined) {
      setRemainingSec(remainingSeconds);
      setWarned(false);

      intervalRef.current = setInterval(() => {
        setRemainingSec((s) => {
          const next = (s || 0) - 1;
          if (next <= 0) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            if (typeof onTimeUp === "function") onTimeUp();
          }
          return next;
        });
      }, 1000);

      return () => clearInterval(intervalRef.current);
    }

    // fallback to expectedExit behaviour (legacy)
    if (!expectedExit) {
      setRemainingSec(null);
      return () => {};
    }

    const update = () => {
      const diffMs = new Date(expectedExit) - new Date();
      const sec = Math.ceil(diffMs / 1000);
      setRemainingSec(sec);
      if (sec <= 2 * 60 && sec > 0 && !warned) {
        setWarned(true);
        if (alertOnWarn && typeof window !== "undefined") {
          try {
            window.alert("⚠️ Less than 2 minutes left in the lab");
          } catch (e) {
            /* ignore */
          }
        }
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [remainingSeconds, expectedExit, alertOnWarn, onTimeUp, warned]);

  if (remainingSec === null) return <p style={{ color: "#666" }}>—</p>;

  if (remainingSec <= 0) {
    return <h3 style={{ color: "red" }}>⏰ Time Up!</h3>;
  }

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;

  return (
    <p style={{ color: warned ? "#b45f00" : "#222" }}>
      {warned ? "⚠️ " : ""}Remaining: {minutes}:{String(seconds).padStart(2, "0")}
    </p>
  );
}
