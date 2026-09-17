import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { createSessionCookie } from "../../../lib/session";
import bcrypt from "bcryptjs";

function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { businessName, passcode } = req.body || {};
  const id = slugify(businessName || "");
  if (!id || !passcode) return res.status(400).json({ error: "Enter your business name and passcode." });
  const { data: client } = await supabaseAdmin.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) return res.status(404).json({ error: "No business found with that name." });
  const match = await bcrypt.compare(passcode, client.passcode_hash);
  if (!match) return res.status(401).json({ error: "Wrong passcode." });
  res.setHeader("Set-Cookie", createSessionCookie({ type: "business", clientId: client.id }));
  return res.status(200).json({ ok: true });
}
