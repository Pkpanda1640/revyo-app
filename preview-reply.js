import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";
import { askClaude } from "../../../lib/anthropic";

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "business") return res.status(401).json({ error: "Not authorized." });
  if (req.method !== "POST") return res.status(405).end();

  const { data: client } = await supabaseAdmin.from("clients").select("business_name, plan").eq("id", session.clientId).maybeSingle();
  if (!client || client.plan !== "premium") return res.status(403).json({ error: "Upgrade to Premium to use this." });

  const { sampleReview } = req.body || {};
  if (!sampleReview || !sampleReview.trim()) return res.status(400).json({ error: "Paste a sample review first." });

  const reply = await askClaude(
    `You are the owner of "${client.business_name}" replying to a Google review. Review: "${sampleReview}". Write a short, warm, professional reply (1-2 sentences). Return ONLY the reply text.`
  );
  return res.status(200).json({ reply });
}
