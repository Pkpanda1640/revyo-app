import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { askGemini } from "../../../lib/gemini";
import { maxSimilarity, isTooSimilar } from "../../../lib/reviewSimilarity";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Google filters near-duplicate reviews on the same business, so every review must
// read differently. The Lite model ignores temperature, so the variety is injected
// in the prompt: a random subset of keywords, a random angle, length and tone, a ban
// on the stock openings it falls back to, and the business's recent reviews as
// examples of wording NOT to reuse. A fresh prompt is built on every call, so a
// regeneration also gets a different angle, length and tone.
function buildPrompt({ client, outlet, rating, highlight, recentTexts }) {
  const languages = client.languages || ["English"];
  const langPart = languages.length
    ? `Write the review primarily in ${languages.join(" and ")}${languages.length > 1 ? ", mixing them naturally the way people casually write online" : ""}.`
    : "";
  const categoryPart = client.custom_form_enabled && client.custom_form_category ? `This is a ${client.custom_form_category.toLowerCase()} business.` : "";
  const highlightPart = highlight ? `The customer specifically mentioned: "${highlight}" — make that the main point of the review.` : "";

  const allKeywords = (outlet.keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
  const usedKeywords = allKeywords.length ? shuffle(allKeywords).slice(0, Math.random() < 0.5 ? 1 : 2) : [outlet.name];
  const angle = pick([
    "the staff and service",
    "the taste of the food or the quality of what they bought",
    "the atmosphere and how comfortable the place felt",
    "value for money",
    "how quick and easy the visit was",
    "why they would come back or recommend it to friends",
    "the occasion they came for (a casual outing, a family meal, a quick stop, etc.)",
  ]);
  const length = pick(["one short sentence", "two sentences", "two or three sentences", "three sentences"]);
  const tone = pick(["casual and chatty", "polite and simple", "warm and enthusiastic", "brief and matter-of-fact"]);

  const recentPart = recentTexts.length
    ? `\nReviews already written for this business — yours must NOT reuse their wording, phrases or sentence structure, and should read clearly different:\n${recentTexts
        .slice(0, 5)
        .map((t) => `- "${t.slice(0, 160)}"`)
        .join("\n")}\n`
    : "";

  return `A customer just visited "${outlet.name}". ${categoryPart} They rated their visit ${rating} out of 5 stars. ${highlightPart} Write a natural, first-person Google review of ${length}, in a ${tone} tone, that focuses on ${angle}. It should sound like a real person typed it quickly on their phone, not like an advertisement. If it fits naturally, you may mention: ${usedKeywords.join(", ")} — but do not list items. Do NOT start with "Had a great", "Visited", "Stopped by", "Great", or "Amazing", and do not mention "family" unless the customer did. ${langPart}${recentPart} Return ONLY the review text — no quotes, no preamble.`;
}

// Only ratings of 4 or 5 should ever reach this route — it's the one that
// produces a review meant for Google. Enforced again here server-side, not
// just in the frontend, so the filter can't be bypassed by calling the API directly.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { clientId, outletId, rating, highlight, phone } = req.body || {};
  if (!clientId || !outletId || !rating) return res.status(400).json({ error: "Missing fields." });
  if (rating < 4) return res.status(400).json({ error: "This endpoint is only for ratings of 4 or 5." });

  const [{ data: client }, { data: outlet }, { data: recent }] = await Promise.all([
    supabaseAdmin.from("clients").select("*").eq("id", clientId).maybeSingle(),
    supabaseAdmin.from("outlets").select("*").eq("id", outletId).eq("client_id", clientId).maybeSingle(),
    supabaseAdmin
      .from("reviews")
      .select("review_text")
      .eq("client_id", clientId)
      .eq("outlet_id", outletId)
      .eq("type", "positive")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  if (!client || !outlet) return res.status(404).json({ error: "Not found." });

  const recentTexts = (recent || []).map((r) => r.review_text).filter(Boolean);
  const generate = () => askGemini(buildPrompt({ client, outlet, rating, highlight, recentTexts }));

  let reviewText;
  try {
    reviewText = await generate();
  } catch (e) {
    // One quick retry — covers transient errors and brief rate-limit blips
    // without adding much wait time.
    try {
      await new Promise((r) => setTimeout(r, 400));
      reviewText = await generate();
    } catch (e2) {
      return res.status(500).json({ error: "Could not generate a review right now." });
    }
  }

  // Near-duplicate guard: if this review is too close to one of the outlet's recent
  // reviews, write it once more and keep whichever is less similar. This costs an
  // extra AI call only when a collision actually happens, and never makes things worse.
  if (isTooSimilar(reviewText, recentTexts)) {
    try {
      const second = await generate();
      if (second && maxSimilarity(second, recentTexts) < maxSimilarity(reviewText, recentTexts)) {
        reviewText = second;
      }
    } catch (e) {
      // keep the first one
    }
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
