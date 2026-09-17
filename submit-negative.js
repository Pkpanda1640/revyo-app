import { supabaseAdmin } from "../../../lib/supabaseAdmin";

// This is the negative-review filter: it only ever writes to your private
// `reviews` table (type: "negative"). It never touches a Google review link,
// so low ratings can never end up posted publicly.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { clientId, outletId, rating, comment, phone } = req.body || {};
  if (!clientId || !outletId || !rating) return res.status(400).json({ error: "Missing fields." });
  if (rating > 3) return res.status(400).json({ error: "This endpoint is only for ratings of 3 or below." });

  await supabaseAdmin.from("reviews").insert({
    client_id: clientId,
    outlet_id: outletId,
    rating,
    type: "negative",
    comment: comment || "",
    phone: phone || "",
  });

  const { data: client } = await supabaseAdmin.from("clients").select("lead_gen_enabled").eq("id", clientId).maybeSingle();
  if (client?.lead_gen_enabled && phone && phone.trim()) {
    await supabaseAdmin.from("leads").insert({ client_id: clientId, outlet_id: outletId, phone: phone.trim(), rating });
  }

  return res.status(200).json({ ok: true });
}
