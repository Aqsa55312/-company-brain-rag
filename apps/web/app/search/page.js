"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function Search() {
  const [q, setQ] = useState("cuti");
  const [docType, setDocType] = useState("");
  const [res, setRes] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMsg("Mencari…");
    try {
      const qs = new URLSearchParams({ q, limit: "5" });
      if (docType) qs.set("doc_type", docType);
      const j = await api(`/search?${qs.toString()}`);
      setRes(j);
      setMsg("");
    } catch (err) {
      setMsg("Gagal: " + err.message);
    } finally { setLoading(false); }
  }
  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h3>🔎 Search dokumen</h3>
        <p className="desc">Tips mode native: pakai <b>satu kata kunci</b> (mis. <code>cuti</code>), bukan kalimat panjang.</p>
        <form onSubmit={submit} className="row">
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="kata kunci…" />
          <select className="input" style={{ maxWidth: 150 }} value={docType} onChange={e => setDocType(e.target.value)}>
            <option value="">semua</option><option value="umum">umum</option><option value="sop">sop</option><option value="cs">cs</option><option value="keuangan">keuangan</option>
          </select>
          <button className="btn" style={{ maxWidth: 130 }} type="submit" disabled={loading}>{loading ? "…" : "Cari"}</button>
        </form>
        {msg && <div className="alert err" style={{ marginTop: 10 }}>{msg}</div>}
        {res && <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge">mode: {res.mode}</span>
          <span className="badge gray">backend: {res.backend}</span>
          <span className="badge green">{res.hits.length} hasil</span>
        </div>}
      </div>
      {res?.hits?.map((h, i) => (
        <div className="card" key={i}>
          <span className="badge">[{h.doc_type}] {h.filename} #{h.chunk_index}</span>
          <span className="badge gray" style={{ marginLeft: 8 }}>skor {Number(h.score).toFixed(3)}</span>
          <p style={{ whiteSpace: "pre-wrap", margin: "10px 0 0", lineHeight: 1.6 }}>{h.text}</p>
        </div>
      ))}
      {res && res.hits.length === 0 && <div className="alert info">Tidak ada hasil. Coba kata lebih pendek / cek doc_type / pastikan dokumen sudah di-index.</div>}
    </div>
  );
}
