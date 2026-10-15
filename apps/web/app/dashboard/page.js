"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/documents").then(setDocs).catch(e => setErr("docs: " + e.message));
    api("/audit/logs").then(setLogs).catch(() => {});
    api("/stats").then(setStats).catch(() => {});
  }, []);
  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="grid c4">
        <div className="card"><div className="kpi">{stats?.documents ?? "–"}</div><div className="kpi-sub">📄 Dokumen</div></div>
        <div className="card"><div className="kpi">{stats?.chunks ?? "–"}</div><div className="kpi-sub">🧩 Chunks</div></div>
        <div className="card"><div className="kpi">{stats?.chats ?? "–"}</div><div className="kpi-sub">💬 Chats</div></div>
        <div className="card"><div className="kpi" style={{ fontSize: 20 }}>{stats ? JSON.stringify(stats.feedback) : "–"}</div><div className="kpi-sub">👍👎 Feedback</div></div>
      </div>
      {!stats && <div className="alert info">Login dulu untuk lihat stats. <a href="/login"><b>Masuk →</b></a></div>}
      {err && <div className="alert err">{err} — pastikan sudah login.</div>}
      <div className="grid c2">
        <div className="card">
          <h3>📄 Dokumen (50 terbaru)</h3>
          <p className="desc">Mode retrieval: <code>{JSON.stringify(stats?.by_mode || {})}</code></p>
          <table className="table"><thead><tr><th>File</th><th>Tipe</th><th>Chunks</th><th>Oleh</th></tr></thead><tbody>
            {docs.map(d => (<tr key={d.id}><td><b>{d.filename}</b><br /><span className="mono">{d.size_bytes}B</span></td><td><span className="badge">{d.doc_type}</span></td><td>{d.chunks}</td><td>{d.username}</td></tr>))}
          </tbody></table>
          {docs.length === 0 && <p className="kpi-sub">Belum ada dokumen.</p>}
        </div>
        <div className="card">
          <h3>🕒 Audit (admin)</h3>
          <p className="desc">Top pertanyaan: {(stats?.top_questions || []).map(t => `${t.q} (${t.n}x)`).join(" | ") || "-"}</p>
          <table className="table"><thead><tr><th>User</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>
            {logs.map(l => (<tr key={l.id}><td>{l.username}</td><td><span className="badge gray">{l.action}</span></td><td className="mono">{l.detail}</td></tr>))}
          </tbody></table>
          {logs.length === 0 && <p className="kpi-sub">Tidak ada log / bukan admin.</p>}
        </div>
      </div>
    </div>
  );
}
