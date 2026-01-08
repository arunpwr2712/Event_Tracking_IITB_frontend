import { useState } from "react";
import { setRole, setGroupId } from "../utils/auth";
import "./Views.css";

export default function Landing({ onLogin }) {
  const [role, setLocalRole] = useState("VOLUNTEER");
  const [group, setGroup] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const managerPassword = process.env.REACT_APP_MANAGER_PASSWORD || "admin";

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (role === "MANAGER") {
      if (password !== managerPassword) {
        setError("Invalid manager password");
        return;
      }
      setRole("MANAGER");
      setGroupId("");
      onLogin();
    } else {
      const id = Number(group);
      if (!id || id <= 0) {
        setError("Enter a valid group number");
        return;
      }
      setRole("VOLUNTEER");
      setGroupId(id);
      onLogin();
    }
  };

  return (
    <div className="views-container" style={{ maxWidth: 480 }}>
      <h1 style={{ marginTop: 8 }}>Welcome</h1>
      <p className="small">Choose your role to continue</p>

      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              name="role"
              value="VOLUNTEER"
              checked={role === "VOLUNTEER"}
              onChange={() => setLocalRole("VOLUNTEER")}
            />
            Volunteer
          </label>

          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              name="role"
              value="MANAGER"
              checked={role === "MANAGER"}
              onChange={() => setLocalRole("MANAGER")}
            />
            Manager
          </label>
        </div>

        {role === "VOLUNTEER" && (
          <input
            placeholder="Group number"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            className="btn"
            style={{ background: "#fff", color: "#111", textAlign: "left" }}
          />
        )}

        {role === "MANAGER" && (
          <input
            placeholder="Manager password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="btn"
            style={{ background: "#fff", color: "#111", textAlign: "left" }}
          />
        )}

        {error && <div className="small" style={{ color: "var(--danger)" }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" type="submit">Continue</button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => { setLocalRole("VOLUNTEER"); setGroup(""); setPassword(""); setError(""); }}
          >
            Reset
          </button>
        </div>

      </form>
    </div>
  );
}