import { useRouter } from "next/router";
import { Store, ShieldCheck } from "lucide-react";
import { Button, Centered } from "../components/ui";

export default function Home() {
  const router = useRouter();
  return (
    <Centered maxWidth={520}>
      <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700, marginBottom: 10 }}>Revyo</div>
      <h1 className="display" style={{ fontSize: 38, lineHeight: 1.15, margin: "0 0 16px" }}>
        Google reviews, handled automatically
      </h1>
      <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 36px" }}>
        One QR code per outlet. Happy customers get an AI-written review to post on Google.
        Anything lower goes straight to the business, privately.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="primary" onClick={() => router.push("/business/login")}>
          <Store size={16} /> Business login
        </Button>
        <Button variant="ghost" onClick={() => router.push("/admin/login")}>
          <ShieldCheck size={16} /> Admin login
        </Button>
      </div>
    </Centered>
  );
}
