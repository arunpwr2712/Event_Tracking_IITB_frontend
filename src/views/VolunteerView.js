import { enterLab, exitLab } from "../api";
import Timer from "../components/Timer";
import LabDirectory from "../components/LabDirectory";
import "./Views.css";

export default function VolunteerView({ groupId, data, onRefresh }) {
  if (!groupId) return <p className="loading">No group selected.</p>;
  const group = data.groups.find((g) => String(g.group_id) === String(groupId));
  if (!group) return (
    <div className="loading">
      <p>Loading group data...</p>
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={() => onRefresh && onRefresh()}>Retry</button>
      </div>
    </div>
  );

  const currentLab = data.labs.find((l) => String(l.occupied_by) === String(groupId));

  const logout = () => {
    import("../utils/auth").then(({ clearAuth }) => {
      clearAuth();
      window.location.reload();
    });
  };

  return (
    <div className="views-container">
      <div className="header">
        <h1>Volunteer Panel — Group {groupId}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="small">State: <strong>{group.state}</strong></div>
          <button className="btn ghost" onClick={logout}>Logout</button>
        </div>
      </div>

      {group.state === "ENTERED" && (
        <div className="card">
          <div className="title">You are in the lab {currentLab ? `(${currentLab.name || `Lab ${currentLab.lab_id}`})` : ""}</div>
          <div className="small">Expected exit: {group.expected_exit_at ? new Date(group.expected_exit_at).toLocaleString() : "—"}</div>
          <div className="small">
            {group.alarm_8_sent ? <span style={{ color: "#b45f00" }}>⚠️ 8-min warning</span> : null}
            {group.alarm_10_sent ? <span style={{ color: "red", marginLeft: 8 }}>⛔ 10-min alert</span> : null}
          </div>
          <Timer remainingSeconds={group ? group.remaining_seconds : null} alertOnWarn={true} />
          <div className="actions">
            <button className="btn ghost" onClick={async () => {
              try {
                await exitLab(groupId);
                if (typeof onRefresh === "function") onRefresh();
              } catch (err) {
                const msg = err?.friendlyMessage || err?.response?.data?.error || err?.message || "Failed to exit lab";
                alert(`Exit failed: ${msg}`);
              }
            }}>Exit Lab</button>
          </div>
        </div>
      )}

      {group.state === "WAITING" && (
        <>
          <div className="small">Assigned labs</div>
          {(!group.allowed_labs || group.allowed_labs.length === 0) ? (
            <p className="small">No labs assigned to you.</p>
          ) : (
            <div className="grid">
              {data.labs
                .filter((l) => (group.allowed_labs || []).includes(l.lab_id) || (group.allowed_labs || []).includes(String(l.lab_id)))
                .map((lab) => (
                  <div className="card" key={lab.lab_id}>
                    <div className="title">{lab.name || `Lab ${lab.lab_id}`}</div>
                    <div className={lab.status === "FREE" ? "badge free" : "badge occupied"}>
                      {lab.status === "FREE" ? "Free" : `Occupied by ${lab.occupied_by}`}
                    </div>

                    {/* show timer for occupied labs */}
                    {lab.status !== "FREE" && (() => {
                      const groupOcc = data.groups.find((g) => String(g.group_id) === String(lab.occupied_by));
                      return <div className="small">Time: <Timer remainingSeconds={groupOcc ? groupOcc.remaining_seconds : null} /></div>;
                    })()}

                    <div className="actions">
                      <button
                        className="btn"
                        disabled={lab.status !== "FREE"}
                        onClick={async () => {
                          try {
                            await enterLab(groupId, lab.lab_id);
                            if (typeof onRefresh === "function") onRefresh();
                          } catch (err) {
                            const msg = err?.friendlyMessage || err?.response?.data?.error || err?.message || "Failed to enter lab";
                            alert(`Enter failed: ${msg}`);
                          }
                        }}
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Lab directory (static info provided) */}
      <LabDirectory />

    </div>
  );
}
