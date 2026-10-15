"use client";
import { useEffect, useState } from "react";
import { API } from "../../lib/api";

export default function Topbar() {
  const [user, setUser] = useState("");
  const [ok, setOk] = useState(null);
  useEffect(() => {
    setUser(localStorage.getItem("brain_user") || "");
    fetch(`${API}/health/live`).then(() => setOk(true)).catch(() => setOk(false));
  }, []);
  function logout() {
    localStorage.removeItem("brain_token");
    localStorage.removeItem("brain_user");
    window.location.href = "/login";
  }
  const d = new Date();
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
  return (
    <div className="topbar">
      <div className="crumb"><b>Arsip Internal</b> / {hari}, {d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
      <div className="top-right">
        <span className="status"><span className={`dot ${ok ? "ok" : ok === false ? "bad" : ""}`} />{ok ? "sistem live" : ok === false ? "API mati" : "menghubungi…"}</span>
        {user ? (
          <span className="who"><span className="avatar">{user[0]?.toUpperCase()}</span>{user}<button className="link-btn" onClick={logout}>Keluar</button></span>
        ) : (
          <a className="link-btn" href="/login">Masuk →</a>
        )}
      </div>
    </div>
  );
}
