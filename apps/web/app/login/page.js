"use client";
import { useState } from "react";
import { API } from "../../lib/api";
import { toast } from "../components/Toaster";

export default function Login() {
  const [u, setU] = useState("admin");
  const [p, setP] = useState("admin123");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      localStorage.setItem("brain_token", j.token);
      localStorage.setItem("brain_user", j.username);
      toast(`Selamat datang, ${j.username}`, "ok");
      window.location.href = "/";
    } catch (err) { setMsg("Masuk gagal: " + err.message); }
    finally { setLoading(false); }
  }
  return (
    <div>
      <span className="kicker">Pintu masuk</span>
      <h2 className="h-display" style={{ fontSize: 26 }}>Buku tamu arsip</h2>
      <div className="login-split">
        <div className="login-brand">
          <span className="stamp" style={{ borderColor: "#f0a35e", color: "#f0a35e" }}>internal · rahasia</span>
          <h2>Satu pintu<br />ke seluruh<br />pengetahuan.</h2>
          <ul>
            <li>✓ SOP, CS, dan keuangan dalam satu cari</li>
            <li>✓ Jawaban selalu menunjuk sumber</li>
            <li>✓ Jejak audit untuk setiap tanya</li>
          </ul>
        </div>
        <div className="login-form">
          <form onSubmit={submit}>
            <div className="field"><label>Nama pengguna</label><input className="input" value={u} onChange={e => setU(e.target.value)} autoComplete="username" /></div>
            <div className="field"><label>Sandi</label><input className="input" type="password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" /></div>
            <button className="btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Memeriksa…" : "Masuk ke arsip →"}</button>
            {msg && <div className="note err">{msg}</div>}
            <div className="note info">Dev: <code>admin / admin123</code> — ganti di produksi.</div>
          </form>
        </div>
      </div>
    </div>
  );
}
