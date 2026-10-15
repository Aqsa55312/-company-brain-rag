"use client";
export function Icon({ d, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  );
}
export const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  chat: "M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  upload: "M12 16V4m0 0 4 4m-4-4-4 4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  key: "M14 10a4 4 0 1 0-4 4c.4 0 .8-.1 1.1-.2L13 15h2v2h2v2h3v-3l-5.3-5.3c.1-.2.3-.5.3-.7z",
  doc: "M6 2h9l5 5v15H6zM14 2v6h6",
  copy: "M9 9h11v11H9zM5 15V4h11",
  check: "M4 12.5 9.5 18 20 6.5",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  x: "M6 6l12 12M18 6 6 18",
};
