"use client";
import { usePathname } from "next/navigation";
import { Icon, PATHS } from "./icons";

const NAV = [
  ["MENU", null],
  ["home", "/", "Beranda"],
  ["chat", "/chat", "Ruang Tanya"],
  ["search", "/search", "Penelusuran"],
  ["upload", "/upload", "Setor Dokumen"],
  ["chart", "/dashboard", "Rekap"],
  ["AKUN", null],
  ["key", "/login", "Masuk / Keluar"],
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="side-top">
        <div className="mark-row">
          <div className="mark">CB</div>
          <div><b>Company Brain</b><span>arsip internal · P4</span></div>
        </div>
        <div className="org">PT Contoh · Divisi Operasional<br />Akses: karyawan terdaftar</div>
      </div>
      <nav className="nav">
        {NAV.map(([icon, href, label], i) =>
          href === null
            ? <div className="nav-sec" key={i}>{icon}</div>
            : (
              <a key={href} href={href} className={path === href || (href !== "/" && path?.startsWith(href)) ? "active" : ""}>
                <Icon d={PATHS[icon]} /> {label}<span className="go">→</span>
              </a>
            )
        )}
      </nav>
      <div className="side-foot">
        Tekan <span className="kbd" style={{ borderColor: "#3d372a", background: "#24211a", color: "#e8e1cd" }}>Ctrl K</span> untuk perintah cepat.
      </div>
    </aside>
  );
}
