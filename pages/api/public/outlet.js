import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const { clientId, outletId } = req.query;

  // select("*") and then pick fields by hand: this keeps the page working even if
  // the review_mode column hasn't been added to the database yet, and guarantees
  // private fields (passcode hash, email, phone) can never leak to the public page.
  const { data: row } = await supabaseAdmin.from("clients").select("*").eq("id", clientId).maybeSingle();

  const { data: outlet } = await supabaseAdmin
    .from("outlets")
    .select("id, name, google_review_link, keywords")
    .eq("id", outletId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!row || !outlet) return res.status(404).json({ error: "Not found." });

  const client = {
    business_name: row.business_name,
    languages: row.languages,
    ai_form_enabled: row.ai_form_enabled,
    lead_gen_enabled: row.lead_gen_enabled,
    custom_form_enabled: row.custom_form_enabled,
    custom_form_category: row.custom_form_category,
    // "own_words" = the customer writes the review (default); "full" = AI writes a ready review.
    review_mode: row.review_mode === "full" ? "full" : "own_words",
  };
  return res.status(200).json({ client, outlet });
}
