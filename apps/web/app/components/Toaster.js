"use client";
import { useEffect, useState } from "react";

let push = null;
export function toast(msg, kind = "") {
  if (push) push(msg, kind);
  else console.log("[toast]", msg);
}

export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let id = 0;
    push = (msg, kind) => {
      const key = ++id;
      setItems(prev => [...prev.slice(-3), { key, msg, kind }]);
      setTimeout(() => setItems(prev => prev.filter(t => t.key !== key)), 3600);
    };
    return () => { push = null; };
  }, []);
  return (
    <div className="toasts">
      {items.map(t => <div key={t.key} className={`toast ${t.kind}`}>{t.msg}</div>)}
    </div>
  );
}
