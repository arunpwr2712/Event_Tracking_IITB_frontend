import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import VolunteerView from "./views/VolunteerView";
import ManagerView from "./views/ManagerView";
import Landing from "./views/Landing";
import { getRole, getGroupId } from "./utils/auth";
import { useSocket } from "./hooks/useSocket";

function App() {

   useEffect(() => {
    console.log("Pinging backend to check readiness...");
   let cancelled = false;
    const pollPing = async () => {
      try {
        // const res = await axios.get('http://localhost:8000/ping');
        const res = await axios.get('https://event-tracking-iitb-backend.onrender.com/ping');
        if (res.data.status === 'ready') {
          if (!cancelled) {
            console.log('Backend is ready');
          }
        } else {
          setTimeout(pollPing, 2000);
        }
      } catch {
        setTimeout(pollPing, 2000);
      }
    };

    pollPing();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // axios.post("http://localhost:8000/refresh", {
    axios.post("https://event-tracking-iitb-backend.onrender.com/refresh", {
      flag: "page_refreshed"
    }).catch(err => console.error("Refresh flag failed:", err));
  }, []);



  const [data, setData] = useState({ labs: [], groups: [] });
  const [, setLoggedInTrigger] = useState(0);
  const role = getRole();
  const groupId = getGroupId();

  const [backendOk, setBackendOk] = useState(true);
  const [backendError, setBackendError] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await axios.get("/status");
      setData(res.data);
      setBackendOk(true);
      setBackendError(null);
    } catch (err) {
      console.error("fetchStatus failed:", err);
      setBackendOk(false);
      const resp = err?.response;
      let msg = err?.message || "Failed to connect to backend";
      if (resp) {
        if (resp.data) msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        else msg = resp.statusText || `HTTP ${resp.status}`;
      }
      setBackendError(msg);
    }
  };

  // Alarm state to show prominent banner/audio when ALARM WS messages arrive
  const [alarm, setAlarm] = useState(null);

  const playAlarmAudio = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
      o.stop(ctx.currentTime + 1.6);
    } catch (e) {
      // fall back to alert
      try { window.alert("Alarm!"); } catch (e) {}
    }
  }, []);

  const onStatus = useCallback((msg) => {
    // msg is expected to contain labs and groups
    if (msg && (msg.labs || msg.groups)) {
      setData({ labs: msg.labs || [], groups: msg.groups || [] });
    }
  }, [setData]);

  const onAlarm = useCallback((msg) => {
    setAlarm(msg);
    playAlarmAudio();

    // update local group flags if present
    if (msg && msg.group_id && msg.alarm) {
      setData((prev) => {
        const groups = prev.groups.map((g) => {
          if (String(g.group_id) === String(msg.group_id)) {
            return {
              ...g,
              alarm_8_sent: msg.alarm === "ALARM_8" ? true : g.alarm_8_sent,
              alarm_10_sent: msg.alarm === "ALARM_10" ? true : g.alarm_10_sent,
            };
          }
          return g;
        });
        return { ...prev, groups };
      });
    }




    // auto-clear banner after 10s
    setTimeout(() => setAlarm(null), 10000);
  }, [setData, playAlarmAudio]);

  useSocket(onStatus, onAlarm);

  useEffect(() => {
    fetchStatus();
  }, []);


  // when the backend appears down, poll periodically to see if it recovers
  useEffect(() => {
    if (backendOk) return;
    const id = setInterval(() => {
      fetchStatus();
    }, 15000);
    return () => clearInterval(id);
  }, [backendOk]);

  const onLogin = () => {
    // bump to re-evaluate role (read from localStorage)
    setLoggedInTrigger((n) => n + 1);
  };

  // if not logged in, show landing page
  if (!role) {
    return <Landing onLogin={onLogin} />;
  }

  const AlarmBanner = ({ a }) => {
    if (!a) return null;
    return (
      <div style={{ background: "#b71c1c", color: "white", padding: 12, textAlign: "center" }}>
        <strong>{a.message || a.alarm}</strong> — Group {a.group_id}
      </div>
    );
  };



  const BackendBanner = ({ ok, err, onRetry }) => {
    if (ok) return null;
    return (
      <div style={{ background: "#ffeb3b", color: "#333", padding: 10, textAlign: "center" }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Cannot reach backend</strong>
          {err ? ` — ${err}` : ""}
        </div>
        <div>
          <button onClick={onRetry} style={{ padding: "6px 12px", cursor: "pointer" }}>
            Retry
          </button>
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Check <code>REACT_APP_BACKEND_URL</code> and network connectivity.
        </div>
      </div>
    );
  };

  const handleRetry = () => {
    setBackendOk(true);
    setBackendError(null);
    fetchStatus();
  };

  if (role === "MANAGER") {
    return (
      <>
        <BackendBanner ok={backendOk} err={backendError} onRetry={handleRetry} />
        <AlarmBanner a={alarm} />
        <ManagerView data={data} onRefresh={fetchStatus} />
        <hr />
        <VolunteerView groupId={groupId} data={data} onRefresh={fetchStatus} />
      </>
    );
  }

  if (role === "VOLUNTEER") {
    return (
      <>
        <BackendBanner ok={backendOk} err={backendError} onRetry={handleRetry} />
        <AlarmBanner a={alarm} />
        <VolunteerView groupId={groupId} data={data} onRefresh={fetchStatus} />
      </>
    );
  }

  return <h2>Unauthorized</h2>;
}

export default App;

