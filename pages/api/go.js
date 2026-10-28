// Test helper: sends the browser to a Google review link with a plain redirect.
// Only Google hosts are allowed, so this can't be used as an open redirect.
const ALLOWED = ["google.com", "www.google.com", "search.google.com", "g.page", "maps.app.goo.gl", "goo.gl", "maps.google.com", "g.co"];
export default function handler(req, res) {
  let url;
  try { url = new URL(String(req.query.u || "")); } catch { return res.status(400).end("Bad link"); }
  if (url.protocol !== "https:" || !ALLOWED.includes(url.hostname)) return res.status(400).end("Not allowed");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, url.toString());
}
