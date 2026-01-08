import "./Views.css";
import { useState } from "react";
import Timer from "../components/Timer";
import { createLab, updateLab, deleteLab, createGroup, updateGroup, deleteGroup, assign, unassign } from "../api";
import LabDirectory from "../components/LabDirectory";

export default function ManagerView({ data, onRefresh }) {
  const logout = () => {
    import("../utils/auth").then(({ clearAuth }) => {
      clearAuth();
      window.location.reload();
    });
  };

  const [newLabName, setNewLabName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  const addLab = async () => {
    if (!newLabName.trim()) return alert("Enter a lab name");
    try {
      await createLab(newLabName.trim());
      setNewLabName("");
      if (typeof onRefresh === "function") await onRefresh(); else window.location.reload();
    } catch (err) {
      alert("Failed to create lab: " + (err?.response?.data?.error || err.message));
    }
  };

  const editLab = async (lab) => {
    const name = window.prompt("New name for lab", lab.name || `Lab ${lab.lab_id}`);
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Lab name cannot be empty");
      return;
    }
    if (trimmed.length > 100) {
      alert("Lab name is too long (max 100 characters)");
      return;
    }

    try {
      await updateLab(lab.lab_id, trimmed);
      if (typeof onRefresh === "function") await onRefresh(); else window.location.reload();
    } catch (err) {
      console.error("updateLab failed", err);
      const resp = err?.response;
      let msg = err?.message || "Request failed";
      if (resp) {
        if (resp.data) {
          if (typeof resp.data === "string") msg = resp.data;
          else if (resp.data.error) msg = resp.data.error;
          else if (resp.data.detail) msg = resp.data.detail;
          else msg = JSON.stringify(resp.data);
        } else {
          msg = resp.statusText || `HTTP ${resp.status}`;
        }
        if (resp.status === 422 && !msg) {
          msg = "Invalid lab update (server rejected input).";
        }
      }
      alert(`Failed to update lab: ${msg}`);
    }
  };

  const removeLab = async (lab) => {
    if (!window.confirm(`Delete lab ${lab.name || lab.lab_id}?`)) return;
    try {
      await deleteLab(lab.lab_id);
      if (typeof onRefresh === "function") await onRefresh(); else window.location.reload();
    } catch (err) {
      alert("Failed to delete lab: " + (err?.response?.data?.error || err.message));
    }
  };

  const addGroup = async () => {
    if (!newGroupName.trim()) return alert("Enter a volunteer name");
    try {
      await createGroup(newGroupName.trim());
      setNewGroupName("");
      if (typeof onRefresh === "function") await onRefresh(); else window.location.reload();
    } catch (err) {
      alert("Failed to create group: " + (err?.response?.data?.error || err.message));
    }
  };

  const [tab, setTab] = useState("labs");
  const [activeAction, setActiveAction] = useState(null); // { groupId, mode: 'assign'|'unassign' }
  const [selectedLabIds, setSelectedLabIds] = useState([]);

  const formatError = (err) => {
    const resp = err?.response;
    let msg = err?.message || "Request failed";
    if (resp) {
      if (resp.data) {
        if (typeof resp.data === "string") msg = resp.data;
        else if (Array.isArray(resp.data) && resp.data.length) msg = JSON.stringify(resp.data);
        else if (typeof resp.data.error !== "undefined") msg = typeof resp.data.error === "string" ? resp.data.error : JSON.stringify(resp.data.error);
        else if (typeof resp.data.detail !== "undefined") msg = typeof resp.data.detail === "string" ? resp.data.detail : JSON.stringify(resp.data.detail);
        else msg = JSON.stringify(resp.data);
      } else {
        msg = resp.statusText || `HTTP ${resp.status}`;
      }
    }
    return msg;
  };

  return (
    <div className="views-container">
      <div className="header">
        <h1>Manager Dashboard</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="small">Labs: {data.labs.length}</div>
          <div className="small">Volunteers: {data.groups.length}</div>
          <button className="btn ghost" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={"btn " + (tab === "labs" ? "" : "ghost")} onClick={() => setTab("labs")}>Labs ({data.labs.length})</button>
        <button className={"btn " + (tab === "groups" ? "" : "ghost")} onClick={() => setTab("groups")}>Volunteers ({data.groups.length})</button>
      </div>

      {tab === "labs" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={newLabName} onChange={(e) => setNewLabName(e.target.value)} placeholder="New lab name" />
            <button className="btn" onClick={addLab}>Add Lab</button>
          </div>

          <div className="grid">
            {data.labs.map((lab) => (
              <div className="card" key={lab.lab_id}>
                <div className="title">{lab.name || `Lab ${lab.lab_id}`}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn ghost" onClick={() => editLab(lab)}>Edit</button>
                  <button className="btn ghost" onClick={() => removeLab(lab)}>Delete</button>
                </div>
                <div className={lab.status === "FREE" ? "badge free" : "badge occupied"}>
                  {lab.status === "FREE" ? "Free" : `Occupied by ${lab.occupied_by}`}
                </div>
                <div className="small">Status: {lab.status}</div>
                {/* show timer for occupied labs */}
                {lab.status !== "FREE" && (() => {
                  const group = data.groups.find((g) => String(g.group_id) === String(lab.occupied_by));
                  return (
                    <div>
                      <div className="small">Time: <Timer remainingSeconds={group ? group.remaining_seconds : null} /></div>
                      <div className="small">
                        {group && group.alarm_8_sent ? <span style={{ color: "#b45f00" }}>⚠️ 8-min</span> : null}
                        {group && group.alarm_10_sent ? <span style={{ color: "red", marginLeft: 8 }}>⛔ 10-min</span> : null}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "groups" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="New volunteer name" />
            <button className="btn" onClick={addGroup}>Add Group</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <h2>Groups</h2>
            <div className="grid">
              {data.groups.map((g) => (
                <div className="card group-card" key={g.group_id}>
                  <div className="group-header">
                    <div className="title">{g.volunteer_name || `Group ${g.group_id}`}</div>
                    <div className={g.state === "ENTERED" ? "badge occupied" : "badge free"}>{g.state}</div>
                  </div>

                  <div className="small group-meta">
                    <div>Allowed labs:</div>
                    <div className="lab-list">
                      {g.allowed_labs && g.allowed_labs.length ? g.allowed_labs.map((id) => {
                        const lab = data.labs.find((l) => String(l.lab_id) === String(id));
                        const isEntered = lab && String(lab.occupied_by) === String(g.group_id);
                        return (
                          <span className={"lab-badge" + (isEntered ? " entered" : "")} key={id}>
                            {lab ? lab.name : `Lab ${id}`}
                            {isEntered ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span className="entered-dot" aria-hidden></span>
                                <span className="entered-text">In</span>
                              </span>
                            ) : null}
                          </span>
                        );
                      }) : <span>—</span>}
                    </div>
                  </div>

                  <div className="group-actions">
                    {activeAction && activeAction.groupId === g.group_id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                        <div className="lab-checkbox-list">
                          {(activeAction.mode === 'assign'
                            ? data.labs.filter((l) => !(g.allowed_labs || []).includes(l.lab_id))
                            : (g.allowed_labs || []).map((id) => data.labs.find((l) => String(l.lab_id) === String(id))).filter(Boolean)
                          ).map((l) => (
                            <label key={l.lab_id} className="lab-checkbox">
                              <input
                                type="checkbox"
                                value={l.lab_id}
                                checked={selectedLabIds.includes(String(l.lab_id))}
                                onChange={(e) => {
                                  const id = String(l.lab_id);
                                  setSelectedLabIds((prev) => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                                }}
                              />
                              <div className="lab-info">
                                <div className="lab-name">{l.name || `Lab ${l.lab_id}`}</div>
                                <div className="lab-meta">{l.status === 'FREE' ? 'Free' : `Occupied by ${l.occupied_by}`}</div>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="group-actions">
                          <div style={{ flex: 1 }}></div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn" onClick={async () => {
                              if (!selectedLabIds.length) return alert('Select at least one lab');
                              try {
                                const tasks = selectedLabIds.map(id => activeAction.mode === 'assign' ? assign(g.group_id, id) : unassign(g.group_id, id));
                                await Promise.all(tasks);
                                setActiveAction(null);
                                setSelectedLabIds([]);
                                if (typeof onRefresh === "function") await onRefresh(); else window.location.reload();
                              } catch (err) {
                                alert(`Failed to ${activeAction.mode}: ${formatError(err)}`);
                              }
                            }}>Confirm</button>
                            <button className="btn ghost" onClick={() => { setActiveAction(null); setSelectedLabIds([]); }}>Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button className="btn" onClick={() => { setActiveAction({ groupId: g.group_id, mode: 'assign' }); setSelectedLabIds([]); }}>Assign</button>
                        <button className="btn ghost" onClick={() => { setActiveAction({ groupId: g.group_id, mode: 'unassign' }); setSelectedLabIds([]); }}>Unassign</button>
                        <button className="btn ghost" onClick={async () => {
                          const name = window.prompt("New volunteer name", g.volunteer_name);
                          if (!name) return;
                          try { await updateGroup(g.group_id, name); if (typeof onRefresh === "function") await onRefresh(); else window.location.reload(); } catch (err) { alert("Failed to update group: " + (err?.response?.data?.error || err.message)); }
                        }}>Edit</button>
                        <button className="btn ghost" onClick={async () => {
                          if (!window.confirm("Delete group?")) return;
                          try { await deleteGroup(g.group_id); if (typeof onRefresh === "function") await onRefresh(); else window.location.reload(); } catch (err) { alert("Failed to delete group: " + (err?.response?.data?.error || err.message)); }
                        }}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Lab directory (static info provided) */}
      <LabDirectory />

    </div>
  );
}
