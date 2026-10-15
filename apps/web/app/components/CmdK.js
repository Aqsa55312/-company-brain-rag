"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PAGES = [
  ["Ruang Tanya — ajukan pertanyaan", "/chat", "chat ⌘1"],
  ["Penelusuran — bedah kata kunci", "/search", "search ⌘2"],
  ["Setor Dokumen — tambah berkas", "/upload", "upload ⌘3"],
  ["Rekap — statistik & audit", "/dashboard", "rekap ⌘4"],
  ["Beranda", "/", "home ⌘0"],
];

export default function CmdK() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const router = useRouter();
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(o => !o); setQ(""); setHi(0); }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const items = PAGES.filter(([label]) => label.toLowerCase().includes(q.toLowerCase()));
  function go(href, withQuery) {
    setOpen(false);
    router.push(withQuery && q.trim() ? `${href}?q=${encodeURIComponent(q.trim())}` : href);
  }
  useEffect(() => {
    function nav(e) {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, items.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
      if (e.key === "Enter" && items[hi]) go(items[hi][1], true);
    }
    window.addEventListener("keydown", nav);
    return () => window.removeEventListener("keydown", nav);
  });
  if (!open) return null;
  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk" onClick={e => e.stopPropagation()}>
        <input autoFocus value={q} onChange={e => { setQ(e.target.value); setHi(0); }} placeholder="Ketik perintah atau kata kunci… (Enter = cari)" />
        <div className="cmdk-list">
          {items.map(([label, href, hint], i) => (
            <button key={href} className={`cmdk-item ${i === hi ? "on" : ""}`} onClick={() => go(href, true)}>
              → {label}<small>{hint}</small>
            </button>
          ))}
          {items.length === 0 && <div style={{ padding: 14, fontSize: 13, color: "var(--ink2)" }}>Tak ada perintah cocok. Tekan Enter untuk cari “{q}”.</div>}
        </div>
      </div>
    </div>
  );
}
