import "./globals.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Toaster from "./components/Toaster";
import CmdK from "./components/CmdK";

export const metadata = { title: "Company Brain — Arsip Internal", description: "Tanya jawab dokumen internal" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="shell">
          <Sidebar />
          <div className="main">
            <Topbar />
            <div className="content"><div className="page">{children}</div><div className="foot">company-brain · berjalan lokal · v4-final</div></div>
          </div>
        </div>
        <Toaster />
        <CmdK />
      </body>
    </html>
  );
}
