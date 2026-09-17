import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { QRCodeSVG } from "qrcode.react";
import {
  Store, Settings, Users, MessageSquare, CreditCard, Plus, ChevronDown, ChevronUp,
  Trash2, Globe, CheckCircle2, Lock,
} from "lucide-react";
import { Button, Field, Badge, SettingRow } from "../../components/ui";
import { api } from "../../lib/api";

const CATEGORIES = ["Restaurant & Cafe", "Medical, Pharmacy & Clinic", "Retail & Shop", "Salon & Spa", "Home Services", "Other"];
const LANGUAGES = ["English", "Hindi", "Marathi"];
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function BusinessDashboard() {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [tab, setTab] = useState("outlets");

  useEffect(() => {
    load();
  }, []);
  async function load() {
    try {
      const data = await api.get("/api/business/me");
      setClient(data.client);
    } catch {
      router.push("/business/login");
    }
  }
  async function updateClient(patch) {
    await api.post("/api/business/update", patch);
    load();
  }
  async function logout() {
    await api.post("/api/logout", {});
    router.push("/");
  }

  if (!client) return <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>Loading…</div>;

  const isPremium = client.plan === "premium";
  const navItems = [
    ["outlets", "Outlets", Store],
    ["ai", "AI settings", Settings],
    ["leads", "Leads", Users],
    ["reviews", "All reviews", MessageSquare],
    ["billing", "Subscription", CreditCard],
  ];

  return (
    <div className="dash-shell">
      <div className="dash-sidebar">
        <div style={{ padding: "6px 10px 22px" }}>
          <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>Revyo</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{client.business_name}</div>
          <div style={{ marginTop: 8 }}>
            <Badge tone={isPremium ? "premium" : "muted"}>{isPremium ? "PREMIUM ACTIVE" : "FREE PLAN"}</Badge>
          </div>
        </div>
        {navItems.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`nav-item ${tab === key ? "nav-item-active" : ""}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
        <button onClick={logout} className="nav-item" style={{ color: "var(--muted)", marginTop: 10 }}>
          Sign out
        </button>
      </div>
      <div className="dash-main">
        {tab === "outlets" && <OutletsTab clientId={client.id} />}
        {tab === "ai" && <AiSettingsTab client={client} updateClient={updateClient} isPremium={isPremium} goBilling={() => setTab("billing")} />}
        {tab === "leads" && <LeadsTab isPremium={isPremium} leadGenEnabled={client.lead_gen_enabled} goBilling={() => setTab("billing")} />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "billing" && <BillingTab isPremium={isPremium} />}
      </div>
    </div>
  );
}

// --- Outlets ---
function OutletsTab({ clientId }) {
  const [outlets, setOutlets] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    load();
  }, []);
  async function load() {
    const data = await api.get("/api/business/outlets");
    setOutlets(data.outlets);
  }
  async function addOutlet() {
    if (!newName.trim()) return;
    await api.post("/api/business/outlets", { name: newName.trim() });
    setNewName("");
    setAdding(false);
    load();
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 className="display" style={{ fontSize: 22, margin: 0 }}>Business outlets</h2>
        <Button variant="primary" style={{ fontSize: 13, padding: "9px 16px" }} onClick={() => setAdding(!adding)}>
          <Plus size={14} /> Add outlet
        </Button>
      </div>
      {adding && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <input className="input" placeholder="Outlet name, e.g. Urban Cafe — Tathawade" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button variant="dark" onClick={addOutlet}>Save</Button>
        </div>
      )}
      {outlets === null && <p style={{ color: "var(--muted)" }}>Loading…</p>}
      {outlets && outlets.length === 0 && !adding && <p style={{ color: "var(--muted)" }}>No outlets yet — add your first one to get a QR code.</p>}
      <div className="surface-card" style={{ overflow: "hidden" }}>
        {outlets &&
          outlets.map((o) => (
            <OutletRow
              key={o.id}
              outlet={o}
              clientId={clientId}
              expanded={expanded === o.id}
              onToggle={() => setExpanded(expanded === o.id ? null : o.id)}
              onSaved={load}
              onDeleted={load}
            />
          ))}
      </div>
    </div>
  );
}

function OutletRow({ outlet, clientId, expanded, onToggle, onSaved, onDeleted }) {
  const [name, setName] = useState(outlet.name);
  const [address, setAddress] = useState(outlet.address || "");
  const [link, setLink] = useState(outlet.google_review_link || "");
  const [keywords, setKeywords] = useState(outlet.keywords || "");
  const qrValue = `${SITE_URL}/r/${clientId}/${outlet.id}`;

  async function save() {
    await api.patch(`/api/business/outlets/${outlet.id}`, { name, address, google_review_link: link, keywords });
    onSaved();
  }
  async function remove() {
    await api.del(`/api/business/outlets/${outlet.id}`);
    onDeleted();
  }

  return (
    <div className="list-row" style={{ display: "block" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{outlet.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{outlet.address || "No address set"}</div>
        </div>
        <Badge tone={outlet.connected ? "success" : "muted"}>
          {outlet.connected ? (
            <>
              <CheckCircle2 size={11} /> CONNECTED
            </>
          ) : (
            "NOT CONNECTED"
          )}
        </Badge>
        {expanded ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
      </div>
      {expanded && (
        <div style={{ paddingTop: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="surface-card" style={{ padding: 16, textAlign: "center" }}>
            {SITE_URL ? (
              <QRCodeSVG value={qrValue} size={140} />
            ) : (
              <p style={{ fontSize: 12, color: "var(--danger)", maxWidth: 140 }}>
                Set NEXT_PUBLIC_SITE_URL in your environment to generate a working QR code.
              </p>
            )}
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, maxWidth: 140 }}>Scans open your live site.</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field label="Outlet name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Address">
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field label="Google review link" hint="From Google Business Profile → Ask for reviews.">
              <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://g.page/r/XXXXXXXX/review" />
            </Field>
            <Field label="Review keywords">
              <input className="input" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="cafe, pizza, burger, fries" />
            </Field>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="dark" style={{ fontSize: 13 }} onClick={save}>Save outlet</Button>
              <Button variant="danger" style={{ fontSize: 13 }} onClick={remove}>
                <Trash2 size={13} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- AI settings ---
function AiSettingsTab({ client, updateClient, isPremium, goBilling }) {
  const [sampleReview, setSampleReview] = useState("");
  const [sampleReply, setSampleReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const languages = client.languages || ["English"];

  function toggleLanguage(lang) {
    const has = languages.includes(lang);
    const next = has ? languages.filter((l) => l !== lang) : [...languages, lang];
    updateClient({ languages: next.length ? next : ["English"] });
  }
  async function previewReply() {
    if (!sampleReview.trim()) return;
    setGenerating(true);
    try {
      const data = await api.post("/api/business/preview-reply", { sampleReview });
      setSampleReply(data.reply);
    } catch (e) {
      setSampleReply(e.message);
    }
    setGenerating(false);
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h2 className="display" style={{ fontSize: 22, marginBottom: 4 }}>AI review settings</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>Controls how reviews are generated for customers, across all your outlets.</p>

      <div style={{ padding: "18px 0", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Globe size={16} color="var(--primary)" />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Languages</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>Select multiple to mix them naturally in the generated review.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LANGUAGES.map((lang) => {
            const active = languages.includes(lang);
            return (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className="btn"
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  fontSize: 13,
                  border: `1px solid ${active ? "var(--primary)" : "var(--line)"}`,
                  background: active ? "var(--primary-soft)" : "#fff",
                  color: active ? "var(--primary)" : "var(--ink)",
                }}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      <SettingRow
        icon={MessageSquare}
        title="AI form"
        description="Show a quick form before generating the review, so the customer can add a specific detail."
        checked={client.ai_form_enabled}
        onChange={(v) => updateClient({ ai_form_enabled: v })}
      />

      <SettingRow
        icon={CheckCircle2}
        title="Auto review reply"
        description="Automatically draft a reply to new customer reviews."
        locked={!isPremium}
        checked={client.auto_reply_enabled}
        onChange={(v) => updateClient({ auto_reply_enabled: v })}
        onLockedClick={goBilling}
      >
        {isPremium && client.auto_reply_enabled && (
          <div style={{ marginTop: 12, padding: 12, background: "var(--bg)", borderRadius: 6, maxWidth: 420 }}>
            <textarea
              className="input"
              style={{ minHeight: 60, marginBottom: 8 }}
              placeholder="Paste a sample review to try it…"
              value={sampleReview}
              onChange={(e) => setSampleReview(e.target.value)}
            />
            <Button variant="ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={previewReply} disabled={generating}>
              {generating ? "Writing…" : "Preview reply"}
            </Button>
            {sampleReply && <p style={{ fontSize: 13, marginTop: 8, fontStyle: "italic" }}>"{sampleReply}"</p>}
          </div>
        )}
      </SettingRow>

      <SettingRow
        icon={Users}
        title="Active lead generation"
        description="Collect customer phone numbers during the review flow for follow-up marketing."
        locked={!isPremium}
        checked={client.lead_gen_enabled}
        onChange={(v) => updateClient({ lead_gen_enabled: v })}
        onLockedClick={goBilling}
      />

      <SettingRow
        icon={Settings}
        title="Custom form"
        description="Tailor the review form's wording to your type of business."
        locked={!isPremium}
        checked={client.custom_form_enabled}
        onChange={(v) => updateClient({ custom_form_enabled: v })}
        onLockedClick={goBilling}
      >
        {isPremium && client.custom_form_enabled && (
          <select
            className="input"
            style={{ maxWidth: 260, marginTop: 10 }}
            value={client.custom_form_category || ""}
            onChange={(e) => updateClient({ custom_form_category: e.target.value })}
          >
            <option value="">Choose a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </SettingRow>
    </div>
  );
}

// --- Leads ---
function LeadsTab({ isPremium, leadGenEnabled, goBilling }) {
  const [leads, setLeads] = useState(null);
  useEffect(() => {
    if (isPremium && leadGenEnabled) load();
    else setLeads([]);
  }, []);
  async function load() {
    const data = await api.get("/api/business/leads");
    setLeads(data.leads);
  }
  if (!isPremium || !leadGenEnabled) {
    return (
      <div style={{ maxWidth: 460 }}>
        <h2 className="display" style={{ fontSize: 22, marginBottom: 10 }}>Leads</h2>
        <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 24, textAlign: "center" }}>
          <Lock size={20} color="var(--premium)" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>
            Turn on Active Lead Generation (Premium) in AI settings to start collecting customer contacts here.
          </p>
          <Button variant="primary" style={{ fontSize: 13 }} onClick={goBilling}>View plans</Button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 560 }}>
      <h2 className="display" style={{ fontSize: 22, marginBottom: 14 }}>Leads</h2>
      {leads === null && <p style={{ color: "var(--muted)" }}>Loading…</p>}
      {leads && leads.length === 0 && <p style={{ color: "var(--muted)" }}>No leads captured yet.</p>}
      <div className="surface-card" style={{ overflow: "hidden" }}>
        {leads &&
          leads.map((l) => (
            <div key={l.id} className="list-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{l.phone}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Rated {l.rating} ★</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(l.created_at).toLocaleDateString()}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

// --- All reviews ---
function ReviewsTab() {
  const [reviews, setReviews] = useState(null);
  useEffect(() => {
    load();
  }, []);
  async function load() {
    const data = await api.get("/api/business/reviews");
    setReviews(data.reviews);
  }
  return (
    <div style={{ maxWidth: 560 }}>
      <h2 className="display" style={{ fontSize: 22, marginBottom: 4 }}>All reviews</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 18 }}>
        Every rating from your QR codes lands here. 4–5 star ones were also sent to Google; 3 and under stayed private.
      </p>
      {reviews === null && <p style={{ color: "var(--muted)" }}>Loading…</p>}
      {reviews && reviews.length === 0 && <p style={{ color: "var(--muted)" }}>Nothing here yet.</p>}
      {reviews &&
        reviews.map((r) => (
          <div key={r.id} className="surface-card" style={{ padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <svg key={n} width={14} height={14} viewBox="0 0 24 24">
                    <path
                      d="M12 2.5l2.9 6.53 7.1.62-5.4 4.73 1.63 6.98L12 17.77l-6.23 3.6 1.63-6.98L2 9.65l7.1-.62z"
                      fill={n <= r.rating ? (r.type === "positive" ? "#B8872F" : "#C1432A") : "none"}
                      stroke={n <= r.rating ? (r.type === "positive" ? "#B8872F" : "#C1432A") : "#E2E5EA"}
                      strokeWidth="1.4"
                    />
                  </svg>
                ))}
              </div>
              <Badge tone={r.type === "positive" ? "success" : "muted"}>{r.type === "positive" ? "SENT TO GOOGLE" : "PRIVATE"}</Badge>
            </div>
            <p style={{ fontSize: 14, margin: "0 0 6px" }}>{r.type === "positive" ? r.review_text || "(review generated)" : r.comment || "(no comment left)"}</p>
            {r.phone && <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 6px" }}>Contact: {r.phone}</p>}
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(r.created_at).toLocaleString()}</div>
          </div>
        ))}
    </div>
  );
}

// --- Billing ---
function BillingTab({ isPremium }) {
  const features = [
    ["QR review collection", true],
    ["AI-generated reviews", true],
    ["Multiple languages", true],
    ["AI pre-review form", true],
    ["Auto review replies", false],
    ["Active lead generation", false],
    ["Custom form per category", false],
  ];
  return (
    <div style={{ maxWidth: 640 }}>
      <h2 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Subscription</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
        Your plan is managed by your Revyo account manager. To change it, get in touch with them directly.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="surface-card" style={{ flex: "1 1 240px", padding: 22, opacity: isPremium ? 0.55 : 1 }}>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>Free</div>
          <div className="display" style={{ fontSize: 26, marginBottom: 16 }}>₹0</div>
          {features.map(([label, free]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 8, color: free ? "var(--ink)" : "#B4B9C1" }}>
              <CheckCircle2 size={14} color={free ? "var(--success)" : "#D1D5DB"} /> {label}
            </div>
          ))}
          {!isPremium && <Badge tone="muted">CURRENT PLAN</Badge>}
        </div>
        <div style={{ flex: "1 1 240px", background: "var(--ink)", color: "#fff", borderRadius: 10, padding: 22 }}>
          <Badge tone="premium">PREMIUM</Badge>
          <div className="display" style={{ fontSize: 26, margin: "10px 0 16px" }}>
            ₹999<span style={{ fontSize: 14, fontWeight: 500 }}>/month</span>
          </div>
          {features.map(([label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 8 }}>
              <CheckCircle2 size={14} color="#8FD6A8" /> {label}
            </div>
          ))}
          {isPremium && <Badge tone="success">CURRENT PLAN</Badge>}
        </div>
      </div>
    </div>
  );
}
