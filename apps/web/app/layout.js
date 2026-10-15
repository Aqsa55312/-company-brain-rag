import "./globals.css";
import Topbar from "./components/Topbar";

export const metadata = { title: "Company Brain", description: "Portal AI internal" };

const NAV = [
  ["🏠", "/", "Home"],
  ["💬", "/chat", "Chat"],
  ["🔎", "/search", "Search"],
  ["📤", "/upload", "Upload"],
  ["📊", "/dashboard", "Dashboard"],
  ["🔑", "/login", "Login"],
];

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark">🧠</div>
              <div><b>Company Brain</b><span>RAG internal • P4 Final</span></div>
            </div>
            <nav className="nav">
              {NAV.map(([icon, href, label]) => (
                <a key={href} href={href}><span>{icon}</span> {label}</a>
              ))}
            </nav>
            <div className="side-foot">
              💡 Login dev: <code>admin / admin123</code>
              <br />Mode native: keyword-search + stub/Ollama.
            </div>
          </aside>
          <div className="main">
            <Topbar />
            <div className="content">
              {children}
              <div className="footer-note">Company Brain • lokal 100% • tanpa GPU • tanpa API berbayar</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
