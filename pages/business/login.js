import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { Button, Field, Centered } from "../../components/ui";
import { api } from "../../lib/api";

export default function BusinessLogin() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      await api.post("/api/business/login", { businessName, passcode });
      router.push("/business/dashboard");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <Centered maxWidth={380}>
      <button
        onClick={() => router.push("/")}
        className="btn btn-ghost"
        style={{ marginBottom: 24, border: "none", padding: 0, color: "var(--muted)" }}
      >
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="display" style={{ fontSize: 26, marginBottom: 6, textAlign: "left" }}>Business login</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 22, textAlign: "left" }}>
        Accounts are created by your account manager once a subscription is activated.
      </p>
      <Field label="Business name">
        <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Urban Cafe" />
      </Field>
      <Field label="Passcode">
        <input className="input" type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
      </Field>
      {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14, textAlign: "left" }}>{error}</div>}
      <Button variant="primary" style={{ width: "100%" }} disabled={loading} onClick={submit}>
        {loading ? "Please wait…" : "Sign in"}
      </Button>
    </Centered>
  );
}
