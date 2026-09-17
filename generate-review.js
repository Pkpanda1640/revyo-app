import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { askClaude } from "../../../lib/anthropic";

// Only ratings of 4 or 5 should ever reach this route — it's the one that
// produces a review meant for Google. Enforced again here server-side, not
// just in the frontend, so the filter can't be bypassed by calling the API directly.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { clientId, outletId, rating, highlight, phone } = req.body || {};
  if (!clientId || !outletId || !rating) return res.status(400).json({ error: "Missing fields." });
  if (rating < 4) return res.status(400).json({ error: "This endpoint is only for ratings of 4 or 5." });

  const { data: client } = await supabaseAdmin.from("clients").select("*").eq("id", clientId).maybeSingle();
  const { data: outlet } = await supabaseAdmin.from("outlets").select("*").eq("id", outletId).eq("client_id", clientId).maybeSingle();
  if (!client || !outlet) return res.status(404).json({ error: "Not found." });

  const languages = client.languages || ["English"];
  const langPart = languages.length
    ? `Write the review primarily in ${languages.join(" and ")}${languages.length > 1 ? ", mixing them naturally the way people casually write online" : ""}.`
    : "";
  const categoryPart = client.custom_form_enabled && client.custom_form_category ? `This is a ${client.custom_form_category.toLowerCase()} business.` : "";
  const highlightPart = highlight ? `The customer specifically mentioned: "${highlight}".` : "";
  const prompt = `A customer just visited "${outlet.name}". ${categoryPart} They rated their visit ${rating} out of 5 stars. ${highlightPart} Write a short, natural, first-person Google review (2-3 sentences) they might post. Genuine and specific, not gushing. ${langPart} Naturally include some of these where relevant: ${outlet.keywords || outlet.name}. Return ONLY the review text — no quotes, no preamble.`;

  let reviewText;
  try {
    reviewText = await askClaude(prompt);
  } catch (e) {
    return res.status(500).json({ error: "Could not generate a review right now." });
  }

  await supabaseAdmin.from("reviews").insert({
    client_id: clientId,
    outlet_id: outletId,
    rating,
    type: "positive",
    review_text: reviewText,
    phone: phone || "",
  });

  if (client.lead_gen_enabled && phone && phone.trim()) {
    await supabaseAdmin.from("leads").insert({ client_id: clientId, outlet_id: outletId, phone: phone.trim(), rating });
  }

  return res.status(200).json({ reviewText, googleReviewLink: outlet.google_review_link });
}
