import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "business") return res.status(401).json({ error: "Not authorized." });
  const { data: client, error } = await supabaseAdmin.from("clients").select("*").eq("id", session.clientId).maybeSingle();
  if (error || !client) return res.status(404).json({ error: "Not found." });
  delete client.passcode_hash;
  return res.status(200).json({ client });
}
