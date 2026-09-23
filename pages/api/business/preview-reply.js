import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";
import { askGemini } from "../../../lib/gemini";
import { isPlanActive } from "../../../lib/planStatus";

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "business") return res.status(401).json({ error: "Not authorized." });
  if (req.method !== "POST") return res.status(405).end();

  const { data: client } = await supabaseAdmin.from("clients").select("business_name, plan, plan_expires_at").eq("id", session.clientId).maybeSingle();
  if (!client || !isPlanActive(client)) return res.status(403).json({ error: "Upgrade to a paid plan to use this." });

  const { sampleReview } = req.body || {};
  if (!sampleReview || !sampleReview.trim()) return res.status(400).json({ error: "Paste a sample review first." });

  const reply = await askGemini(
    `You are the owner of "${client.business_name}" replying to a Google review. Review: "${sampleReview}". Write a short, warm, professional reply (1-2 sentences). Return ONLY the reply text.`
  );
  return res.status(200).json({ reply });
}
