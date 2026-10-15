"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/documents").then(setDocs).catch(e => setErr("Tak bisa memuat berkas: " + e.message));
    api("/audit/logs").then(setLogs).catch(() => {});
    api("/stats").then(setStats).catch(() => {});
  }, []);
  const modes = useMemo(() => {
    const m = stats?.by_mode || {};
    const total = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(m).map(([k, v], i) => ({ k, v, pct: Math.round((v / total) * 100), cls: i === 1 ? "b2" : i === 2 ? "b3" : "" }));
  }, [stats]);
  const fb = stats?.feedback || {};
  const good = Number(fb["1"] || 0), bad = Number(fb["-1"] || 0);
  const fbTotal = good + bad || 1;
  const dash = Math.round((good / fbTotal) * 100);
  const C = 2 * Math.PI * 30;
  return (
    <div>
      <span className="kicker">Rekap</span>
      <h2 className="h-display" style={{ fontSize: 26 }}>Buku besar arsip</h2>
      <p className="lede">Isi gudang, jalur retrieval, penilaian, dan jejak audit. {!stats && <a href="/login" style={{ textDecoration: "underline", fontWeight: 700 }}>Masuk dulu →</a>}</p>
      {err && <div className="note err" style={{ marginTop: 10 }}>{err}</div>}

      <div className="statline">
        <div className="stat"><div className="n">{stats?.documents ?? "…"}</div><div className="l">dokumen</div></div>
        <div className="stat"><div className="n">{stats?.chunks ?? "…"}</div><div className="l">potongan</div></div>
        <div className="stat"><div className="n">{stats?.chats ?? "…"}</div><div className="l">tanya-jawab</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 20 }}>{dash}% 👍</div><div className="l">{good} baik · {bad} kurang</div></div>
      </div>

      <div className="cols2" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="panel-h"><h3>Jalur retrieval</h3><span className="hint">per mode</span></div>
          {modes.length === 0 && <p style={{ color: "var(--ink2)", fontSize: 13 }}>Belum ada chat tercatat.</p>}
          {modes.map(m => (
            <div className="bar-row" key={m.k}><span className="tag mode">{m.k}</span><span className="bar-track"><span className={`bar-fill ${m.cls}`} style={{ display: "block", width: `${m.pct}%` }} /></span><b>{m.v}</b></div>
          ))}
          <hr className="rule" />
          <div className="panel-h"><h3>Sering ditanya</h3></div>
          {(stats?.top_questions || []).map((t, i) => (
            <div className="rank" key={i}><span className="rn">{String(i + 1).padStart(2, "0")}</span><span>“{t.q}” <span className="mono">· {t.n}×</span></span></div>
          ))}
          {(stats?.top_questions || []).length === 0 && <p style={{ color: "var(--ink2)", fontSize: 13 }}>—</p>}
        </div>
        <div className="panel">
          <div className="panel-h"><h3>Penilaian warga</h3><span className="hint">👍 vs 👎</span></div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <svg width="84" height="84" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="30" fill="none" stroke="#ece6d5" strokeWidth="10" />
              <circle cx="42" cy="42" r="30" fill="none" stroke="#15803d" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(dash / 100) * C} ${C}`} transform="rotate(-90 42 42)" />
              <text x="42" y="47" textAnchor="middle" fontSize="15" fontWeight="800" fill="#1b1915">{dash}%</text>
            </svg>
            <div style={{ fontSize: 13 }}>Dari <b>{good + bad}</b> penilaian:<br />👍 {good} membantu · 👎 {bad} kurang</div>
          </div>
          <hr className="rule" />
          <div className="panel-h"><h3>Isi gudang</h3><span className="hint">{docs.length} berkas</span></div>
          <table className="tbl"><tbody>
            {docs.slice(0, 8).map(d => (<tr key={d.id}><td><b>{d.filename}</b><div className="mono">{d.size_bytes} B · {d.username}</div></td><td><span className={`tag ${d.doc_type}`}>{d.doc_type}</span></td><td>{d.chunks}</td></tr>))}
          </tbody></table>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-h"><h3>Jejak audit</h3><span className="hint">khusus admin · 20 terakhir</span></div>
        <table className="tbl"><thead><tr><th>Siapa</th><th>Apa</th><th>Rincian</th></tr></thead><tbody>
          {logs.slice(0, 20).map(l => (<tr key={l.id}><td>{l.username}</td><td><span className="tag mode">{l.action}</span></td><td className="mono">{l.detail}</td></tr>))}
        </tbody></table>
        {logs.length === 0 && <p style={{ color: "var(--ink2)", fontSize: 13 }}>Tak ada jejak / bukan admin.</p>}
      </div>
    </div>
  );
}
