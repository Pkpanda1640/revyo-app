import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { clientId, outletId } = req.query;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("business_name, languages, ai_form_enabled, lead_gen_enabled, custom_form_enabled, custom_form_category")
    .eq("id", clientId)
    .maybeSingle();

  const { data: outlet } = await supabaseAdmin
    .from("outlets")
    .select("id, name, google_review_link, keywords")
    .eq("id", outletId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!client || !outlet) return res.status(404).json({ error: "Not found." });
  return res.status(200).json({ client, outlet });
}
