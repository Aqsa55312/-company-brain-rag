"use client";
import { useState } from "react";
import { API, getToken, api } from "../../lib/api";
import { toast } from "../components/Toaster";
import { Icon, PATHS } from "../components/icons";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("sop");
  const [over, setOver] = useState(false);
  const [phase, setPhase] = useState(""); // upload | index | done
  const [loading, setLoading] = useState(false);
  function pick(f) {
    if (!f) return;
    setFile(f); setPhase("");
  }
  async function submit(e) {
    e.preventDefault();
    if (!file) { toast("Pilih berkasnya dulu", "err"); return; }
    setLoading(true);
    try {
      setPhase("upload");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("doc_type", type);
      const res = await fetch(`${API}/ingest/upload`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setPhase("index");
      const idx = await api("/ingest/index", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document_id: j.id }) });
      setPhase("done");
      toast(`Arsip no. ${j.id}: ${idx.chunks} potongan terindeks`, "ok");
    } catch (err) { toast("Setor gagal: " + err.message, "err"); setPhase(""); }
    finally { setLoading(false); }
  }
  const pct = phase === "upload" ? 35 : phase === "index" ? 75 : phase === "done" ? 100 : 0;
  return (
    <div>
      <span className="kicker">Setor dokumen</span>
      <h2 className="h-display" style={{ fontSize: 26 }}>Tambah berkas ke arsip</h2>
      <p className="lede">pdf / docx / txt / md / csv / log · maks 20 MB. Masuk → otomatis dipotong & diindeks.</p>
      <div className="cols2" style={{ marginTop: 14 }}>
        <div className="panel">
          <form onSubmit={submit}>
            <div className="field"><label>Map arsip</label>
              <div className="seg">
                {["sop", "cs", "keuangan", "umum"].map(t => (
                  <button key={t} type="button" className={type === t ? "on" : ""} onClick={() => setType(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className={`drop ${over ? "over" : ""}`}
              onDragOver={e => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
              onClick={() => document.getElementById("filepick").click()}>
              <Icon d={PATHS.upload} size={26} />
              <div style={{ fontWeight: 700, marginTop: 6 }}>{file ? file.name : "Seret berkas ke sini, atau klik"}</div>
              <div className="mono">{file ? `${(file.size / 1024).toFixed(1)} KB` : "pdf · docx · txt · md · csv · log"}</div>
              <input id="filepick" type="file" onChange={e => pick(e.target.files?.[0])} />
            </div>
            {pct > 0 && <div className="prog"><i style={{ width: `${pct}%` }} /></div>}
            {phase && <div className="mono" style={{ marginTop: 6 }}>{phase === "upload" ? "mengunggah…" : phase === "index" ? "memotong & mengindeks…" : "selesai ✓"}</div>}
            <div style={{ marginTop: 12 }}>
              <button className="btn-accent" disabled={loading || !file} style={{ width: "100%" }}>{loading ? "Memproses…" : "Setor + indeks →"}</button>
            </div>
          </form>
        </div>
        <div className="panel">
          <div className="panel-h"><h3>Tata cara setor</h3></div>
          <ol className="steps">
            <li><span className="sn">a</span><span>Berkas <b>berisi teks</b> — bukan foto/scan tanpa OCR.</span></li>
            <li><span className="sn">b</span><span>Map yang tepat menentukan cara motong & temu kembali.</span></li>
            <li><span className="sn">c</span><span>Uji dengan <b>satu kata kunci</b> di penelusuran.</span></li>
          </ol>
          <hr className="rule" />
          <p style={{ fontSize: 12.5, color: "var(--ink2)" }}>Belum masuk? Token habis biasanya penyebabnya — <a href="/login" style={{ textDecoration: "underline", fontWeight: 700 }}>masuk ulang</a>.</p>
        </div>
      </div>
    </div>
  );
}
