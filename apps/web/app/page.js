"use client";
import { useEffect, useState } from "react";
import { API, api } from "../lib/api";

export default function Home() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json()).then(setHealth).catch(() => setHealth({ ok: false }));
    api("/stats").then(setStats).catch(() => {});
  }, []);
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="hero">
        <h2>Tanya dokumen internal, dapat jawaban + sitasi.</h2>
        <p>Upload SOP/CS/keuangan → index → search hybrid → chat RAG dengan sitasi [1..n]. Semua jalan lokal, hemat, dan teraudit.</p>
        <div className="actions">
          <a className="btn" href="/chat">💬 Mulai Chat</a>
          <a className="btn btn-ghost" style={{ background: "rgba(255,255,255,.15)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }} href="/upload">📤 Upload Dokumen</a>
        </div>
        <div className="quick">
          <a href="/search">🔎 Search</a>
          <a href="/dashboard">📊 Dashboard</a>
          <a href="/login">🔑 Login</a>
        </div>
      </div>

      <div className="grid c4">
        <div className="card"><div className="kpi">{stats ? stats.documents : "–"}</div><div className="kpi-sub">📄 Dokumen</div></div>
        <div className="card"><div className="kpi">{stats ? stats.chunks : "–"}</div><div className="kpi-sub">🧩 Chunks terindex</div></div>
        <div className="card"><div className="kpi">{stats ? stats.chats : "–"}</div><div className="kpi-sub">💬 Chat tersimpan</div></div>
        <div className="card"><div className="kpi" style={{ fontSize: 22 }}>{health ? (health.ok ? "● LIVE" : "● MATI") : "…"}</div><div className="kpi-sub">⚡ Stage {health?.stage || "P4"}</div></div>
      </div>

      <div className="grid c2">
        <div className="card">
          <h3>⚡ Status sistem</h3>
          <p className="desc">Kesehatan API, vector DB, dan LLM.</p>
          {!health && <p>Memuat…</p>}
          {health && (
            <div className="grid" style={{ gap: 8 }}>
              <span className={`badge ${health.ok ? "green" : ""}`}>API: {health.ok ? "OK" : "FAIL"}</span>
              <span className={`badge ${health?.qdrant?.ok ? "green" : "gray"}`}>Qdrant: {health?.qdrant?.ok ? "OK" : "keyword-fallback"}</span>
              <span className={`badge ${health?.llm?.ok ? "green" : "gray"}`}>LLM: {health?.llm?.chat_model || "-"} {health?.llm?.has_chat ? "✓" : ""}</span>
              <div className="mono">{JSON.stringify(health).slice(0, 400)}</div>
            </div>
          )}
        </div>
        <div className="card">
          <h3>🚀 Alur 3 langkah</h3>
          <p className="desc">Paling cepat dari nol ke jawaban.</p>
          <table className="table">
            <tbody>
              <tr><td><b>1</b></td><td><b>Login</b> dengan <code>admin / admin123</code></td><td><a className="btn btn-ghost" style={{ padding: "6px 10px" }} href="/login">Buka</a></td></tr>
              <tr><td><b>2</b></td><td><b>Upload</b> pdf/docx/txt/csv lalu <b>index</b></td><td><a className="btn btn-ghost" style={{ padding: "6px 10px" }} href="/upload">Buka</a></td></tr>
              <tr><td><b>3</b></td><td><b>Chat</b> + beri 👍/👎, pantau di dashboard</td><td><a className="btn btn-ghost" style={{ padding: "6px 10px" }} href="/chat">Buka</a></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
