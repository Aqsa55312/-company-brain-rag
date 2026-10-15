"use client";
import { useState } from "react";
import { API } from "../../lib/api";

export default function Login() {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("admin123");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      localStorage.setItem("brain_token", j.token);
      localStorage.setItem("brain_user", j.username);
      setMsg("ok");
      window.location.href = "/";
    } catch (err) {
      setMsg("Gagal: " + err.message);
    } finally { setLoading(false); }
  }
  return (
    <div style={{ maxWidth: 420, margin: "30px auto" }}>
      <div className="card">
        <h3>🔑 Selamat datang kembali</h3>
        <p className="desc">Login untuk akses search, chat, dan upload.</p>
        <form onSubmit={submit} className="grid" style={{ gap: 10 }}>
          <div><label className="lbl">Username</label><input className="input" value={u} onChange={e => setU(e.target.value)} placeholder="admin" /></div>
          <div><label className="lbl">Password</label><input className="input" value={p} onChange={e => setP(e.target.value)} type="password" placeholder="••••••••" /></div>
          <button className="btn" type="submit" disabled={loading}>{loading ? "Masuk…" : "Masuk →"}</button>
          {msg.startsWith("Gagal") && <div className="alert err">{msg}</div>}
          <div className="alert info">Dev default: <code>admin / admin123</code></div>
        </form>
      </div>
    </div>
  );
}
