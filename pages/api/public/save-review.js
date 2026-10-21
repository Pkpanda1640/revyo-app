import { supabaseAdmin } from "../../../lib/supabaseAdmin";

// Used by the "own words" flow. It records the review the customer wrote at the
// moment they tap "Copy & Continue to Google", so the dashboard shows what they
// actually took to Google. Like generate-review, it is only for 4–5 star ratings:
// anything lower must go through submit-negative and never near a Google link.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { clientId, outletId, rating, reviewText, phone } = req.body || {};
  if (!clientId || !outletId) return res.status(400).json({ error: "Missing fields." });
  if (![4, 5].includes(Number(rating))) return res.status(400).json({ error: "This endpoint is only for ratings of 4 or 5." });

  const text = (reviewText || "").trim();
  if (text.length < 10 || text.length > 2000) return res.status(400).json({ error: "Review text is missing or too long." });

  const [{ data: outlet }, { data: client }] = await Promise.all([
    supabaseAdmin.from("outlets").select("id").eq("id", outletId).eq("client_id", clientId).maybeSingle(),
    supabaseAdmin.from("clients").select("lead_gen_enabled").eq("id", clientId).maybeSingle(),
  ]);
  if (!outlet || !client) return res.status(404).json({ error: "Not found." });

  await supabaseAdmin.from("reviews").insert({
    client_id: clientId,
    outlet_id: outletId,
    rating: Number(rating),
    type: "positive",
    review_text: text,
    phone: (phone || "").trim(),
  });

  if (client.lead_gen_enabled && phone && phone.trim()) {
    await supabaseAdmin.from("leads").insert({ client_id: clientId, outlet_id: outletId, phone: phone.trim(), rating: Number(rating) });
  }

  return res.status(200).json({ ok: true });
}
