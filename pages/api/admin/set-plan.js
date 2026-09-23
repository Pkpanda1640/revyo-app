import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";
import { planExpiryFromNow } from "../../../lib/planStatus";

const VALID_PLANS = ["free", "monthly", "quarterly", "yearly", "lifetime"];

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "admin") return res.status(401).json({ error: "Not authorized." });
  if (req.method !== "POST") return res.status(405).end();

  const { id, plan } = req.body || {};
  if (!VALID_PLANS.includes(plan)) return res.status(400).json({ error: "Invalid plan." });

  const { error } = await supabaseAdmin
    .from("clients")
    .update({ plan, plan_expires_at: planExpiryFromNow(plan) })
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ plan });
}
