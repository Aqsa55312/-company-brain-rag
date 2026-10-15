export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("brain_token") || "";
}
export async function api(path, opts = {}) {
  const headers = opts.headers || {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
