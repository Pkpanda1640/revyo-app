import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { Button, Field, Centered } from "../../components/ui";
import { api } from "../../lib/api";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      await api.post("/api/admin/login", { username, password });
      router.push("/admin/dashboard");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <Centered maxWidth={360}>
      <button
        onClick={() => router.push("/")}
        className="btn btn-ghost"
        style={{ marginBottom: 24, border: "none", padding: 0, color: "var(--muted)" }}
      >
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="display" style={{ fontSize: 24, marginBottom: 18, textAlign: "left" }}>Admin login</h2>
      <Field label="Username">
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field label="Password">
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14, textAlign: "left" }}>{error}</div>}
      <Button variant="dark" style={{ width: "100%" }} disabled={loading} onClick={submit}>
        {loading ? "Please wait…" : "Sign in"}
      </Button>
    </Centered>
  );
}
