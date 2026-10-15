"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, api } from "../lib/api";
import { Icon, PATHS } from "./components/icons";

const SUGGEST = ["cuti", "lembur", "reimburse", "izin", "kontrak"];
const FCOLOR = { pdf: "#c2410c", docx: "#1d4ed8", txt: "#57534a", md: "#0e7490", csv: "#3f6212", log: "#6b7280" };

function ext(name) {
  const m = (name || "").split(".").pop()?.toLowerCase();
  return FCOLOR[m] ? m : "txt";
}

export default function Home() {
  const [q, setQ] = useState("");
  const [user, setUser] = useState("");
  const [stats, setStats] = useState(null);
  const [docs, setDocs] = useState([]);
  const [logs, setLogs] = useState([]);
  const router = useRouter();
  useEffect(() => {
    setUser(localStorage.getItem("brain_user") || "");
    api("/stats").then(setStats).catch(() => {});
    api("/documents").then(setDocs).catch(() => {});
    api("/audit/logs").then(setLogs).catch(() => {});
  }, []);
  const h = new Date().getHours();
  const greet = h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 19 ? "Selamat sore" : "Selamat malam";
  function goSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }
  return (
    <div>
      <span className="kicker">Ruang arsip · operasional harian</span>
      <h2 className="h-display">{greet}{user ? `, ${user}` : ""}.<br />Mau tahu apa dari dokumen hari ini?</h2>
      <p className="lede">Ketik satu kata kunci — kami carikan potongan dokumennya beserta sumbernya. Tekan <span className="kbd">Ctrl K</span> kapan saja untuk perintah cepat.</p>

      <form onSubmit={goSearch} className="cmdbar">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Coba: cuti, lembur, reimburse…" />
        <button type="submit">Cari ↵</button>
      </form>
      <div className="suggest">
        {SUGGEST.map(s => <button key={s} type="button" onClick={() => router.push(`/search?q=${s}`)}>“{s}”</button>)}
      </div>

      <div className="statline">
        <div className="stat"><div className="n">{stats ? stats.documents : "…"}</div><div className="l">dokumen</div></div>
        <div className="stat"><div className="n">{stats ? stats.chunks : "…"}</div><div className="l">potongan indeks</div></div>
        <div className="stat"><div className="n">{stats ? stats.chats : "…"}</div><div className="l">tanya-jawab</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 15 }}>{stats ? (stats.top_questions?.[0]?.q || "—") : "…"}</div><div className="l">paling sering ditanya</div></div>
      </div>

      <div className="cols2" style={{ marginTop: 14 }}>
        <div className="panel">
          <div className="panel-h"><h3>Terakhir disetor</h3><span className="hint"><a href="/upload" style={{ textDecoration: "underline" }}>+ setor</a></span></div>
          {docs.length === 0 && <div className="empty">Gudang masih kosong.<br /><a href="/upload" style={{ textDecoration: "underline", fontWeight: 700 }}>Setor berkas pertama →</a></div>}
          {docs.slice(0, 6).map(d => (
            <div className="doc-row" key={d.id}>
              <span className="ficon" style={{ background: FCOLOR[ext(d.filename)] || "#57534a" }}><Icon d={PATHS.doc} size={16} /></span>
              <span className="meta"><b>{d.filename}</b><span className="mono">{d.size_bytes} B · {d.chunks} potong · {d.username}</span></span>
              <span className={`tag ${d.doc_type}`}>{d.doc_type}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-h"><h3>Aktivitas terakhir</h3><span className="hint"><a href="/dashboard" style={{ textDecoration: "underline" }}>rekap</a></span></div>
          {logs.length === 0 && <div className="empty">Belum ada aktivitas tercatat — masuk lalu cari atau tanya sesuatu.</div>}
          {logs.slice(0, 7).map(l => (
            <div className="doc-row" key={l.id}>
              <span className="meta"><b style={{ fontWeight: 600 }}>{l.username} · <span className="tag mode">{l.action}</span></b><span className="mono">{l.detail}</span></span>
            </div>
          ))}
          <hr className="rule" />
          <span className="stamp">lokal · tanpa cloud</span>
          <p className="mono" style={{ marginTop: 8 }}>API {API} · Qdrant kosong = fallback kata kunci (wajar, mode native)</p>
        </div>
      </div>
    </div>
  );
}
