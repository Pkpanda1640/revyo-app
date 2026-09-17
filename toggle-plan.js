import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "admin") return res.status(401).json({ error: "Not authorized." });
  if (req.method !== "POST") return res.status(405).end();
  const { id } = req.body || {};
  const { data: client } = await supabaseAdmin.from("clients").select("plan").eq("id", id).maybeSingle();
  if (!client) return res.status(404).json({ error: "Not found." });
  const newPlan = client.plan === "premium" ? "free" : "premium";
  const { error } = await supabaseAdmin.from("clients").update({ plan: newPlan }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ plan: newPlan });
}
