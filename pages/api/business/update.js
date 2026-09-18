import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";

const ALLOWED = ["languages", "ai_form_enabled", "auto_reply_enabled", "lead_gen_enabled", "custom_form_enabled", "custom_form_category"];

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "business") return res.status(401).json({ error: "Not authorized." });
  if (req.method !== "POST") return res.status(405).end();
  const patch = {};
  for (const key of ALLOWED) {
    if (key in (req.body || {})) patch[key] = req.body[key];
  }
  const { error } = await supabaseAdmin.from("clients").update(patch).eq("id", session.clientId);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
