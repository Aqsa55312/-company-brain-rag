"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function Chat() {
  const [q, setQ] = useState("cuti");
  const [docType, setDocType] = useState("");
  const [res, setRes] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMsg("Berpikir… (Ollama CPU bisa 1–2 mnt)");
    try {
      const j = await api("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, limit: 5, doc_type: docType || null })
      });
      setRes(j);
      setMsg("");
    } catch (err) {
      setMsg("Gagal: " + err.message);
    } finally { setLoading(false); }
  }
  async function fb(rating) {
    if (!res?.chat_id) return;
    try {
      await api("/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: res.chat_id, rating }) });
      setMsg("Feedback tersimpan: " + (rating === 1 ? "👍 membantu" : "👎 kurang"));
    } catch (err) { setMsg("Feedback gagal: " + err.message); }
  }
  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h3>💬 Chat + sitasi</h3>
        <p className="desc">Pakai kata kunci singkat di mode native. Contoh: <code>cuti</code> bukan kalimat panjang.</p>
        <form onSubmit={submit} className="row">
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Tanya dokumen internal…" />
          <select className="input" style={{ maxWidth: 140 }} value={docType} onChange={e => setDocType(e.target.value)}>
            <option value="">semua</option><option value="umum">umum</option><option value="sop">sop</option><option value="cs">cs</option><option value="keuangan">keuangan</option>
          </select>
          <button className="btn" style={{ maxWidth: 120 }} type="submit" disabled={loading}>{loading ? "…" : "Kirim"}</button>
        </form>
        {msg && <div className="alert info" style={{ marginTop: 10 }}>{msg}</div>}
      </div>
      {res && (
        <div className="chat-box">
          <div className="bubble q">{q}</div>
          <div className="bubble a">
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span className="badge green">🤖 {res.llm}</span>
              <span className="badge gray">{res.retrieval.mode}</span>
            </div>
            {res.answer}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => fb(1)}>👍 membantu</button>
              <button className="btn btn-ghost" onClick={() => fb(-1)}>👎 kurang</button>
            </div>
            <h4 style={{ margin: "14px 0 4px" }}>📎 Sitasi [{res.citations.length}]</h4>
            {res.citations.map(c => (
              <div className="cite" key={c.n}>
                <b>[{c.n}] {c.filename}#{c.chunk_index}</b> <span className="badge gray">skor {Number(c.score).toFixed(3)}</span>
                <p style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{c.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
