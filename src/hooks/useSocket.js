import { useEffect, useRef } from "react";

// Enhanced WebSocket hook — calls specific callbacks for STATUS and ALARM messages
// Adds automatic reconnect with exponential backoff and sensible URL selection
export const useSocket = (onStatus, onAlarm, onAny) => {
  const wsRef = useRef(null);
  const attemptsRef = useRef(0);
  const closedByUserRef = useRef(false);
  const handlersRef = useRef({ onStatus, onAlarm, onAny });

  // keep latest handler refs without recreating socket
  useEffect(() => {
    handlersRef.current = { onStatus, onAlarm, onAny };
  }, [onStatus, onAlarm, onAny]);

  useEffect(() => {
    closedByUserRef.current = false;

    const getUrl = () => {
      const configured = process.env.REACT_APP_WS_URL;
      if (configured) return configured;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${window.location.host}/ws`;
    };

    const connect = () => {
      const url = getUrl();
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WS connected", url);
          attemptsRef.current = 0;
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            const { onStatus: s, onAlarm: a, onAny: any } = handlersRef.current;
            if (msg && msg.type === "STATUS" && typeof s === "function") s(msg);
            else if (msg && msg.type === "ALARM" && typeof a === "function") a(msg);
            else if (typeof any === "function") any(msg);
          } catch (err) {
            console.error("WS parse error", err);
            const { onAny: any } = handlersRef.current;
            if (typeof any === "function") any(ev.data);
          }
        };

        ws.onerror = (e) => {
          console.warn("WS error", e);
        };

        ws.onclose = (e) => {
          console.log("WS closed", e.code, e.reason);
          wsRef.current = null;
          if (!closedByUserRef.current) {
            const wait = Math.min(30000, 1000 * 2 ** attemptsRef.current);
            attemptsRef.current += 1;
            setTimeout(connect, wait);
          }
        };
      } catch (e) {
        console.error("WS connection failed", e);
        const wait = Math.min(30000, 1000 * 2 ** attemptsRef.current);
        attemptsRef.current += 1;
        setTimeout(connect, wait);
      }
    };

    connect();

    return () => {
      closedByUserRef.current = true;
      try { wsRef.current && wsRef.current.close(); } catch (e) {}
    };
  }, []);
};
