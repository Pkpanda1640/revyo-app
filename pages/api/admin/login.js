import { createSessionCookie } from "../../../lib/session";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    res.setHeader("Set-Cookie", createSessionCookie({ type: "admin" }));
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: "Incorrect username or password." });
}
