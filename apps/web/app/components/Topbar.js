"use client";
import { useEffect, useState } from "react";
import { API } from "../../lib/api";

export default function Topbar() {
  const [user, setUser] = useState("");
  const [healthOk, setHealthOk] = useState(null);
  useEffect(() => {
    setUser(localStorage.getItem("brain_user") || "");
    fetch(`${API}/health/live`).then(() => setHealthOk(true)).catch(() => setHealthOk(false));
  }, []);
  function logout() {
    localStorage.removeItem("brain_token");
    localStorage.removeItem("brain_user");
    setUser("");
    window.location.href = "/login";
  }
  return (
    <div className="topbar">
      <div>
        <h1>Portal Internal</h1>
        <div className="sub">RAG + Lakehouse + Analytics — P4 Final</div>
      </div>
      <div className="pill">
        <span className={`dot ${healthOk ? "ok" : healthOk === false ? "bad" : ""}`} />
        {healthOk ? "API live" : healthOk === false ? "API mati" : "cek API…"}
        {user ? (
          <span className="user-chip">👤 {user}<button onClick={logout}>Keluar</button></span>
        ) : (
          <a className="btn" style={{ padding: "8px 13px" }} href="/login">Login</a>
        )}
      </div>
    </div>
  );
}
