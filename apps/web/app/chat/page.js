"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "../components/Toaster";
import { Icon, PATHS } from "../components/icons";

export default function Chat() {
  const [q, setQ] = useState("");
  const [docType, setDocType] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState({});
  const bottom = useRef(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  async function submit(e) {
    e?.preventDefault();
    const text = q.trim();
    if (!text || loading) return;
    setQ("");
    setMsgs(m => [...m, { role: "q", text }]);
    setLoading(true);
    try {
      const j = await api("/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, limit: 5, doc_type: docType || null })
      });
      // efek ketik
      const full = j.answer || "(kosong)";
      const id = Date.now();
      setMsgs(m => [...m, { role: "a", text: "", full, id, citations: j.citations || [], llm: j.llm, mode: j.retrieval?.mode, chat_id: j.chat_id }]);
      let i = 0;
      const step = () => {
        i += Math.max(2, Math.ceil(full.length / 90));
        const done = i >= full.length;
        const slice = full.slice(0, i);
        setMsgs(m => m.map(x => x.id === id ? { ...x, text: slice, done } : x));
        if (!done) setTimeout(step, 18);
      };
      step();
    } catch (err) {
      toast("Tanya gagal: " + err.message, "err");
      setMsgs(m => [...m, { role: "a", text: "Maaf, permintaannya gagal. Coba pendekkan kata kunci atau ulangi.", err: true }]);
    }
    finally { setLoading(false); }
  }
  async function fb(chat_id, rating, id) {
    try {
      await api("/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id, rating }) });
      setVoted(v => ({ ...v, [id]: rating }));
      toast(rating === 1 ? "Dicatat: membantu" : "Dicatat: kurang membantu", "ok");
    } catch (err) { toast("Feedback gagal: " + err.message, "err"); }
  }
  function copy(text) {
    navigator.clipboard?.writeText(text).then(() => toast("Jawaban disalin", "ok")).catch(() => toast("Gagal menyalin", "err"));
  }
  return (
    <div>
      <span className="kicker">Ruang tanya</span>
      <h2 className="h-display" style={{ fontSize: 26 }}>Tanya, kami tunjukkan sumbernya</h2>
      <p className="lede">Setiap jawaban menunjuk potongan dokumen [1..n]. Riwayat tersimpan di bawah — bisa dinilai satu per satu.</p>

      <div className="thread">
        {msgs.length === 0 && !loading && (
          <div className="empty">Belum ada percakapan. Contoh: <b>cuti</b>, <b>lembur</b>, <b>reimburse</b> —<br />lalu tekan Enter.</div>
        )}
        {msgs.map((m, i) => m.role === "q" ? (
          <div className="msg-q" key={i}>{m.text}</div>
        ) : (
          <div className="msg-a" key={m.id ?? i}>
            <div className="msg-meta">
              {m.llm && <span className="tag mode">🤖 {m.llm}</span>}
              {m.mode && <span className="tag mode">{m.mode}</span>}
              <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button className="mini-btn" title="Salin" onClick={() => copy(m.full || m.text)}><Icon d={PATHS.copy} size={13} /></button>
              </span>
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}{!m.done && m.full && <span className="caret" />}</div>
            {m.done !== false && m.citations?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <b style={{ fontFamily: "Georgia,serif" }}>Sumber [{m.citations.length}]</b>
                {m.citations.map(c => (
                  <div className="src" key={c.n}><b>[{c.n}] {c.filename}</b> <span className="mono">#{c.chunk_index} · {Number(c.score).toFixed(3)}</span>
                    <p style={{ whiteSpace: "pre-wrap", margin: "5px 0 0" }}>{c.snippet}</p></div>
                ))}
                {m.chat_id && (
                  <div className="fbrow">
                    <button className={`mini-btn ${voted[m.id] === 1 ? "done" : ""}`} onClick={() => fb(m.chat_id, 1, m.id)}>👍 Membantu</button>
                    <button className={`mini-btn ${voted[m.id] === -1 ? "done" : ""}`} onClick={() => fb(m.chat_id, -1, m.id)}>👎 Kurang</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="msg-a"><div className="sk">membaca arsip dan merangkai jawaban…</div><div className="sk" style={{ marginTop: 8 }}>menghubungi model bahasa…</div></div>}
        <div ref={bottom} />
      </div>

      <form onSubmit={submit} className="cmdbar" style={{ position: "sticky", bottom: 12, marginTop: 16 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tulis pertanyaan pendek…" />
        <select value={docType} onChange={e => setDocType(e.target.value)}>
          <option value="">semua</option><option value="sop">sop</option><option value="cs">cs</option><option value="keuangan">keuangan</option><option value="umum">umum</option>
        </select>
        <button disabled={loading}>{loading ? "…" : "Kirim ↵"}</button>
      </form>
      <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 6 }}>Catatan: Ollama di CPU bisa butuh 1–2 menit per jawaban — biarkan mengalir.</div>
    </div>
  );
}
