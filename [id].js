import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getSession } from "../../../../lib/session";

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "business") return res.status(401).json({ error: "Not authorized." });
  const { id } = req.query;

  if (req.method === "PATCH") {
    const { name, address, google_review_link, keywords } = req.body || {};
    const connected = !!(google_review_link && google_review_link.trim());
    const { error } = await supabaseAdmin
      .from("outlets")
      .update({ name, address, google_review_link, keywords, connected })
      .eq("id", id)
      .eq("client_id", session.clientId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin.from("outlets").delete().eq("id", id).eq("client_id", session.clientId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
