import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "business") return res.status(401).json({ error: "Not authorized." });

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("outlets").select("*").eq("client_id", session.clientId).order("created_at");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ outlets: data });
  }

  if (req.method === "POST") {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: "Outlet name is required." });
    const { data, error } = await supabaseAdmin
      .from("outlets")
      .insert({ client_id: session.clientId, name: name.trim() })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ outlet: data });
  }

  return res.status(405).end();
}
