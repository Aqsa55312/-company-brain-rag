"use client";
import { useState } from "react";
import { API, getToken, api } from "../../lib/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("sop");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!file) return setMsg("Pilih file dulu");
    setLoading(true); setMsg("Upload…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("doc_type", type);
      const res = await fetch(`${API}/ingest/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      // auto-index
      setMsg(`Upload OK (id=${j.id}). Indexing…`);
      const idx = await api("/ingest/index", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: j.id })
      });
      setMsg(`✅ Selesai: ${j.id} → ${idx.chunks} chunks (${idx.backend}). Langsung bisa dicari.`);
    } catch (err) {
      setMsg("Gagal: " + err.message);
    } finally { setLoading(false); }
  }
  return (
    <div className="grid c2">
      <div className="card">
        <h3>📤 Upload ke Bronze</h3>
        <p className="desc">pdf / docx / txt / md / csv / log • maks 20MB • otomatis di-index.</p>
        <form onSubmit={submit} className="grid" style={{ gap: 10 }}>
          <div><label className="lbl">Tipe dokumen</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              <option value="umum">umum</option><option value="sop">sop</option><option value="cs">cs</option><option value="keuangan">keuangan</option>
            </select>
          </div>
          <div><label className="lbl">File</label><input className="input" type="file" onChange={e => setFile(e.target.files[0])} /></div>
          <button className="btn" type="submit" disabled={loading}>{loading ? "Proses…" : "Upload + Index →"}</button>
          {msg && <div className={`alert ${msg.startsWith("Gagal") ? "err" : msg.startsWith("✅") ? "ok" : "info"}`}>{msg}</div>}
        </form>
      </div>
      <div className="card">
        <h3>📋 Syarat cepat terindex</h3>
        <p className="desc">Agar langsung ketemu di search/chat.</p>
        <table className="table"><tbody>
          <tr><td>📝</td><td>File ada teksnya (bukan scan gambar tanpa OCR)</td></tr>
          <tr><td>🏷️</td><td>doc_type benar: sop / cs / keuangan / umum</td></tr>
          <tr><td>🔎</td><td>Test search pakai <b>1 kata kunci</b> persis</td></tr>
        </tbody></table>
      </div>
    </div>
  );
}
