import { useEffect, useRef, useState } from "react";
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
  const [suggested, setSuggested] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const savedRef = useRef(false);

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
    if (stars <= 3) {
      setStage("negative-form");
      return;
    }
    if (info.client.review_mode !== "full") {
      // "Own words" flow: the customer writes the review themselves.
      setGoogleLink(info.outlet.google_review_link || "");
      setStage("own-words");
      return;
    }
    setStage(info.client.ai_form_enabled ? "ai-form" : "generating");
  }

  useEffect(() => {
    if (stage === "generating") generate();
  }, [stage]);

  // "Full" flow: the AI writes a ready-made review.
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

  // "Own words" flow: optional help for customers who don't know what to write.
  // draft:true means nothing is saved until they actually continue to Google.
  async function suggest() {
    setBusy(true);
    setSuggestError("");
    try {
      const data = await api.post("/api/public/generate-review", {
        clientId,
        outletId,
        rating,
        highlight: suggested ? "" : reviewText.trim(),
        draft: true,
      });
      setReviewText(data.reviewText);
      setSuggested(true);
    } catch (e) {
      setSuggestError("Couldn't get a suggestion right now — you can still write your own.");
    }
    setBusy(false);
  }

  async function submitNegative() {
    setBusy(true);
    await api.post("/api/public/submit-negative", { clientId, outletId, rating, comment, phone });
    setBusy(false);
    setStage("negative-thanks");
  }

  function copyAndGo() {
    const ownWords = info && info.client.review_mode !== "full";
    const link = googleLink || (info && info.outlet.google_review_link) || "";
    navigator.clipboard.writeText(reviewText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    // Own-words flow: record what the customer took to Google (once per visit).
    // Done after window.open so a slow network can never block the Google page.
    if (ownWords && !savedRef.current) {
      savedRef.current = true;
      api.post("/api/public/save-review", { clientId, outletId, rating, reviewText, phone }).catch(() => {
        savedRef.current = false;
      });
    }
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

  const canContinue = reviewText.trim().length >= 15;
  const ownLink = googleLink || info.outlet.google_review_link || "";

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

      {stage === "own-words" && (
        <>
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 8px" }}>Glad you enjoyed it!</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>
            Tell others about your visit in your own words — a line or two is perfect.
          </p>
          <textarea
            className="input"
            style={{ minHeight: 110, marginBottom: 6 }}
            value={reviewText}
            maxLength={1000}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you like? What did you try or buy? How was the service?"
          />
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "left", marginBottom: 14 }}>
            Ideas: what you ordered or bought, the staff, the atmosphere, value for money.
          </p>
          {info.client.lead_gen_enabled && (
            <input className="input" style={{ marginBottom: 14 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional, for offers)" />
          )}
          <Button variant="dark" style={{ width: "100%" }} disabled={!canContinue || !ownLink} onClick={copyAndGo}>
            <ExternalLink size={14} /> {copied ? "Copied — opening Google…" : "Copy & Continue to Google"}
          </Button>
          {!canContinue && (
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Write a short sentence to continue.</p>
          )}
          {!ownLink && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 10 }}>This outlet hasn't connected a Google review link yet.</p>}
          <button
            type="button"
            onClick={suggest}
            disabled={busy}
            style={{ marginTop: 16, background: "none", border: "none", color: "var(--primary)", fontSize: 13, cursor: busy ? "default" : "pointer", textDecoration: "underline" }}
          >
            {busy ? "Writing a suggestion…" : "Not sure what to write? Get a suggestion"}
          </button>
          {suggestError && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}>{suggestError}</p>}
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
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>Make it your own — change a few words or add a detail from your visit before you post.</p>
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
