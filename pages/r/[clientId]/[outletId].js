import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ExternalLink } from "lucide-react";
import { Button, Centered, StarRating } from "../../../components/ui";
import { api } from "../../../lib/api";

export default function CustomerReviewPage() {
  const router = useRouter();
  const { clientId, outletId } = router.query;
  const [info, setInfo] = useState(undefined);
  const [rating, setRating] = useState(0);
  const [stage, setStage] = useState("rate");
  const [comment, setComment] = useState("");
  const [highlight, setHighlight] = useState("");
  const [phone, setPhone] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [googleLink, setGoogleLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!clientId || !outletId) return;
    api
      .get(`/api/public/outlet?clientId=${clientId}&outletId=${outletId}`)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [clientId, outletId]);

  function questionText() {
    if (!info) return "How was your visit today?";
    const cat = info.client.custom_form_enabled ? info.client.custom_form_category : "";
    if (cat === "Medical, Pharmacy & Clinic") return "How was your visit to our pharmacy today?";
    if (cat === "Restaurant & Cafe") return "How was your meal today?";
    if (cat === "Salon & Spa") return "How was your appointment today?";
    return "How was your visit today?";
  }

  // The filter: 3 stars or fewer never generates a review or sees a Google
  // link — it only ever goes to the private feedback form.
  function chooseRating(stars) {
    setRating(stars);
    if (stars <= 3) setStage("negative-form");
    else setStage(info.client.ai_form_enabled ? "ai-form" : "generating");
  }

  useEffect(() => {
    if (stage === "generating") generate();
  }, [stage]);

  async function generate() {
    setBusy(true);
    try {
      const data = await api.post("/api/public/generate-review", { clientId, outletId, rating, highlight, phone });
      setReviewText(data.reviewText);
      setGoogleLink(data.googleReviewLink);
      setStage("positive-review");
    } catch (e) {
      setStage("error");
    }
    setBusy(false);
  }
  async function submitAiForm() {
    setStage("generating");
  }
  async function submitNegative() {
    setBusy(true);
    await api.post("/api/public/submit-negative", { clientId, outletId, rating, comment, phone });
    setBusy(false);
    setStage("negative-thanks");
  }
  function copyAndGo() {
    navigator.clipboard.writeText(reviewText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (googleLink) window.open(googleLink, "_blank", "noopener,noreferrer");
  }

  if (info === undefined) {
    return (
      <>
        <Head><meta name="referrer" content="no-referrer" /></Head>
        <Centered>
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        </Centered>
      </>
    );
  }
  if (info === null) {
    return (
      <>
        <Head><meta name="referrer" content="no-referrer" /></Head>
        <Centered>
          <p>This link isn't valid.</p>
        </Centered>
      </>
    );
  }

  return (
    <>
      <Head><meta name="referrer" content="no-referrer" /></Head>
      <Centered maxWidth={400}>
      <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>{info.outlet.name}</div>

      {stage === "rate" && (
        <>
          <h2 className="display" style={{ fontSize: 24, margin: "0 0 22px" }}>{questionText()}</h2>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StarRating rating={rating} size={38} onRate={chooseRating} />
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>Tap a star to continue</div>
        </>
      )}

      {stage === "negative-form" && (
        <>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 10px" }}>Sorry to hear that.</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>
            Tell us what went wrong — this goes straight to the business, not anywhere public.
          </p>
          <textarea
            className="input"
            style={{ minHeight: 90, marginBottom: 12 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What happened?"
          />
          {info.client.lead_gen_enabled && (
            <input className="input" style={{ marginBottom: 14 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional)" />
          )}
          <Button variant="primary" style={{ width: "100%" }} disabled={busy} onClick={submitNegative}>
            Send feedback
          </Button>
        </>
      )}

      {stage === "negative-thanks" && (
        <>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 10px" }}>Thank you.</h2>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>The business has received your feedback.</p>
        </>
      )}

      {stage === "ai-form" && (
        <>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 10px" }}>Glad you had a good visit!</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>Anything specific stand out?</p>
          <input
            className="input"
            style={{ marginBottom: 12 }}
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            placeholder="e.g. the staff were super helpful"
          />
          {info.client.lead_gen_enabled && (
            <input className="input" style={{ marginBottom: 14 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional, for offers)" />
          )}
          <Button variant="primary" style={{ width: "100%" }} onClick={submitAiForm}>
            Continue
          </Button>
        </>
      )}

      {stage === "generating" && (
        <>
          <div className="spinner" />
          <h2 className="display" style={{ fontSize: 22, margin: "16px 0 10px" }}>One moment…</h2>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Writing a review draft for you.</p>
          <style jsx>{`
            .spinner {
              width: 34px;
              height: 34px;
              margin: 0 auto;
              border: 3px solid var(--line);
              border-top-color: var(--primary);
              border-radius: 50%;
              animation: spin 0.7s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}

      {stage === "error" && (
        <>
          <p style={{ color: "var(--danger)", marginBottom: 14 }}>Something went wrong generating your review.</p>
          <Button variant="primary" onClick={() => setStage("generating")}>Try again</Button>
        </>
      )}

      {stage === "positive-review" && (
        <>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 8px" }}>Here's a review you can post</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>Edit it if you'd like — it's yours.</p>
          <textarea className="input" style={{ minHeight: 110, marginBottom: 14 }} value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
          <Button variant="dark" style={{ width: "100%" }} onClick={copyAndGo}>
            <ExternalLink size={14} /> {copied ? "Copied — opening Google…" : "Copy & Continue to Google"}
          </Button>
          {!googleLink && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 10 }}>This outlet hasn't connected a Google review link yet.</p>}
        </>
      )}
      </Centered>
    </>
  );
}
