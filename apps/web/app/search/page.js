"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { toast } from "../components/Toaster";

function hi(text, q) {
  if (!q || !text) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

function SearchBody() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [docType, setDocType] = useState("");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  async function run(query) {
    const queryText = (query ?? q).trim();
    if (!queryText) { toast("Isi kata kuncinya dulu", "err"); return; }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ q: queryText, limit: "8" });
      if (docType) qs.set("doc_type", docType);
      const j = await api(`/search?${qs.toString()}`);
      setRes({ ...j, _q: queryText });
    } catch (err) { toast("Pencarian gagal: " + err.message, "err"); }
    finally { setLoading(false); }
  }
  useEffect(() => { const init = params.get("q"); if (init) { setQ(init); run(init); } /* eslint-disable-next-line */ }, []);
  return (
    <div>
      <span className="kicker">Penelusuran</span>
      <h2 className="h-display" style={{ fontSize: 26 }}>Bedah kata kunci</h2>
      <p className="lede">Satu kata persis (mis. <code>cuti</code>) jauh lebih kena daripada kalimat panjang — keterbatasan mode keyword native.</p>
      <form onSubmit={e => { e.preventDefault(); run(); }} className="cmdbar">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="mis. cuti" />
        <button disabled={loading}>{loading ? "Membaca…" : "Bedah ↵"}</button>
      </form>
      <div style={{ marginTop: 10, maxWidth: 420 }}>
        <div className="seg">
          {["", "sop", "cs", "keuangan", "umum"].map(t => (
            <button key={t} type="button" className={docType === t ? "on" : ""} onClick={() => setDocType(t)}>{t === "" ? "semua" : t}</button>
          ))}
        </div>
      </div>
      {loading && <div className="panel" style={{ marginTop: 12 }}><div className="sk">memuat hasil pencarian…</div><div className="sk" style={{ marginTop: 8 }}>baris kedua…</div></div>}
      {res && !loading && <p style={{ fontSize: 12.5, color: "var(--ink2)" }}><b>{res.hits.length}</b> potongan kena · <span className="tag mode">{res.mode}</span> <span className="tag mode">{res.backend}</span></p>}
      {res?.hits?.map((h, i) => (
        <div className="panel hover" key={i} style={{ marginTop: 10 }}>
          <span className={`tag ${h.doc_type}`}>{h.doc_type}</span>
          <b style={{ marginLeft: 8 }}>{h.filename}</b>
          <span className="mono" style={{ marginLeft: 8 }}>#{h.chunk_index} · skor {Number(h.score).toFixed(3)}</span>
          <p style={{ whiteSpace: "pre-wrap", margin: "10px 0 0" }}>{hi(h.text, res._q)}</p>
        </div>
      ))}
      {res && !loading && res.hits.length === 0 && <div className="empty" style={{ marginTop: 12 }}>Nihil untuk “{res._q}”.<br />Pendekkan kata, ganti segmen map, atau pastikan berkasnya sudah disetor + terindeks.</div>}
    </div>
  );
}

export default function Search() {
  return <Suspense><SearchBody /></Suspense>;
}
