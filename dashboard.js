import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Plus, CheckCircle2, Copy, ArrowLeft } from "lucide-react";
import { Button, Field, Badge } from "../../components/ui";
import { api } from "../../lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState(null);
  const [counts, setCounts] = useState({});
  const [view, setView] = useState("list");
  const [created, setCreated] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await api.get("/api/admin/businesses");
      setClients(data.clients);
      setCounts(data.counts);
    } catch {
      router.push("/admin/login");
    }
  }
  async function togglePlan(id) {
    await api.post("/api/admin/toggle-plan", { id });
    load();
  }
  async function logout() {
    await api.post("/api/logout", {});
    router.push("/");
  }

  if (view === "new") {
    return (
      <NewBusinessForm
        onCancel={() => setView("list")}
        onCreated={(r) => {
          setCreated(r);
          setView("created");
          load();
        }}
      />
    );
  }

  if (view === "created" && created) {
    return (
      <div className="centered" style={{ maxWidth: 440, paddingTop: 60 }}>
        <CheckCircle2 size={28} color="var(--success)" style={{ marginBottom: 10 }} />
        <h2 className="display" style={{ fontSize: 22, marginBottom: 6 }}>Account created</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
          Send these to {created.businessName} — they'll enter them on the business login screen.
        </p>
        <div className="surface-card" style={{ padding: 18, textAlign: "left", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Business name</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>{created.businessName}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Passcode</div>
          <div style={{ fontWeight: 600, fontSize: 15, fontFamily: "monospace" }}>{created.passcode}</div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Button
            variant="ghost"
            onClick={() =>
              navigator.clipboard.writeText(`Business name: ${created.businessName}\nPasscode: ${created.passcode}`)
            }
          >
            <Copy size={14} /> Copy credentials
          </Button>
          <Button variant="dark" onClick={() => setView("list")}>Back to businesses</Button>
        </div>
      </div>
    );
  }

  const total = clients ? clients.length : 0;
  const premiumCount = clients ? clients.filter((c) => c.plan === "premium").length : 0;
  const totalOutlets = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>Revyo · Admin</div>
          <h2 className="display" style={{ fontSize: 26, margin: "4px 0 0" }}>All businesses</h2>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" style={{ fontSize: 13, padding: "9px 16px" }} onClick={() => setView("new")}>
            <Plus size={14} /> New business
          </Button>
          <button onClick={logout} className="btn btn-ghost">Sign out</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 30, flexWrap: "wrap" }}>
        {[["Businesses", total], ["Premium", premiumCount], ["Outlets", totalOutlets]].map(([label, val]) => (
          <div key={label} className="surface-card" style={{ flex: "1 1 140px", padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
            <div className="display" style={{ fontSize: 26 }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="surface-card" style={{ overflow: "hidden" }}>
        {clients === null && <div style={{ padding: 20, color: "var(--muted)" }}>Loading…</div>}
        {clients && clients.length === 0 && <div style={{ padding: 20, color: "var(--muted)" }}>No businesses yet — add the first one.</div>}
        {clients &&
          clients.map((c) => (
            <div key={c.id} className="list-row">
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{c.business_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.owner_email || "no email"} · {c.owner_phone || "no phone"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {counts[c.id] || 0} outlet(s) · joined {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge tone={c.plan === "premium" ? "premium" : "muted"}>{c.plan === "premium" ? "PREMIUM" : "FREE"}</Badge>
              <Button variant="ghost" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => togglePlan(c.id)}>
                {c.plan === "premium" ? "Set to free" : "Set to premium"}
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}

function NewBusinessForm({ onCancel, onCreated }) {
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [plan, setPlan] = useState("premium");
  const [passcode, setPasscode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    setError("");
    setLoading(true);
    try {
      const record = await api.post("/api/admin/businesses", { businessName, ownerEmail, ownerPhone, plan, passcode });
      onCreated(record);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "50px 20px" }}>
      <button onClick={onCancel} className="btn btn-ghost" style={{ marginBottom: 20, border: "none", padding: 0, color: "var(--muted)" }}>
        <ArrowLeft size={14} /> Back to businesses
      </button>
      <h2 className="display" style={{ fontSize: 22, marginBottom: 4 }}>Activate a new business</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
        Enter what the field agent collected, choose a plan, and a login will be generated to hand over.
      </p>
      <Field label="Business name">
        <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Urban Cafe" />
      </Field>
      <Field label="Owner email">
        <input className="input" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
      </Field>
      <Field label="Owner contact number">
        <input className="input" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
      </Field>
      <Field label="Plan">
        <div style={{ display: "flex", gap: 8 }}>
          {["free", "premium"].map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className="btn"
              style={{
                flex: 1,
                textTransform: "capitalize",
                border: `1px solid ${plan === p ? "var(--primary)" : "var(--line)"}`,
                background: plan === p ? "var(--primary-soft)" : "#fff",
                color: plan === p ? "var(--primary)" : "var(--ink)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Passcode" hint="Auto-generated — edit if you'd rather set your own.">
        <input className="input" style={{ fontFamily: "monospace" }} value={passcode} onChange={(e) => setPasscode(e.target.value)} />
      </Field>
      {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</div>}
      <Button variant="primary" style={{ width: "100%" }} disabled={loading} onClick={create}>
        {loading ? "Creating…" : "Create account & activate"}
      </Button>
    </div>
  );
}
