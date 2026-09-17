import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { getSession } from "../../../lib/session";
import bcrypt from "bcryptjs";

function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session || session.type !== "admin") return res.status(401).json({ error: "Not authorized." });

  if (req.method === "GET") {
    const { data: clients, error } = await supabaseAdmin.from("clients").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const { data: outlets } = await supabaseAdmin.from("outlets").select("client_id");
    const counts = {};
    (outlets || []).forEach((o) => {
      counts[o.client_id] = (counts[o.client_id] || 0) + 1;
    });
    return res.status(200).json({ clients, counts });
  }

  if (req.method === "POST") {
    const { businessName, ownerEmail, ownerPhone, plan, passcode } = req.body || {};
    if (!businessName || !passcode) return res.status(400).json({ error: "Business name and passcode are required." });
    const id = slugify(businessName);
    if (!id) return res.status(400).json({ error: "Invalid business name." });
    const { data: existing } = await supabaseAdmin.from("clients").select("id").eq("id", id).maybeSingle();
    if (existing) return res.status(409).json({ error: "A business with this name already exists." });
    const passcodeHash = await bcrypt.hash(passcode, 10);
    const { error } = await supabaseAdmin.from("clients").insert({
      id,
      business_name: businessName.trim(),
      passcode_hash: passcodeHash,
      owner_email: (ownerEmail || "").trim(),
      owner_phone: (ownerPhone || "").trim(),
      plan: plan === "premium" ? "premium" : "free",
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ businessName: businessName.trim(), passcode });
  }

  return res.status(405).end();
}
