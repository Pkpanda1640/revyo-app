import { useState } from "react";
import Head from "next/head";

// Hidden test page (not linked anywhere). Tries four ways of opening Google.
// Use: paste the Google review link, type/paste a review, tap "Copy review",
// then try ONE variant per test with an account that hasn't posted there.
export default function LinkTest() {
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const ok = link.startsWith("https://");
  const box = { display: "block", width: "100%", boxSizing: "border-box", padding: "13px 16px", borderRadius: 12, border: "2px solid #111", color: "#111", fontWeight: 600, fontSize: 15, textDecoration: "none", textAlign: "center", marginBottom: 10, background: "#fff", cursor: "pointer" };
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <Head><title>Link test</title><meta name="robots" content="noindex" /></Head>
      <h3>Link test (internal)</h3>
      <input value={link} onChange={(e) => setLink(e.target.value.trim())} placeholder="Paste Google review link" style={{ ...box, textAlign: "left", fontWeight: 400 }} />
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Review text" style={{ ...box, textAlign: "left", fontWeight: 400, minHeight: 80 }} />
      <button style={box} onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
        {copied ? "Copied ✓" : "Copy review"}
      </button>
      <p style={{ fontSize: 13, color: "#555" }}>Now use ONE variant per test:</p>
      <a style={{ ...box, opacity: ok ? 1 : 0.4 }} href={ok ? link : "#"}>V1: Same tab, plain link</a>
      <a style={{ ...box, opacity: ok ? 1 : 0.4 }} href={ok ? `/api/go?u=${encodeURIComponent(link)}` : "#"}>V2: Server redirect (same tab)</a>
      <a style={{ ...box, opacity: ok ? 1 : 0.4 }} href={ok ? `/api/go?u=${encodeURIComponent(link)}` : "#"} target="_blank" rel="noopener noreferrer">V3: Server redirect (new tab)</a>
      <button style={{ ...box, opacity: ok ? 1 : 0.4 }} disabled={!ok} onClick={() => { setTimeout(() => { window.location.href = link; }, 1500); }}>V4: Wait 1.5s, then same tab</button>
    </div>
  );
}
