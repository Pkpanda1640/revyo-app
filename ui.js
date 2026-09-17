import { Lock } from "lucide-react";

export function Button({ children, onClick, variant = "primary", className = "", style, disabled, href, target, type = "button" }) {
  const cls = `btn btn-${variant} ${className}`;
  if (href) {
    return (
      <a href={href} target={target} rel={target ? "noopener noreferrer" : undefined} className={cls} style={style} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} style={style} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = "premium" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Toggle({ checked, onChange, locked, onLockedClick }) {
  return (
    <div
      className="toggle-track"
      style={{ background: locked ? "#E5E7EB" : checked ? "var(--primary)" : "#D1D5DB" }}
      onClick={() => (locked ? onLockedClick && onLockedClick() : onChange(!checked))}
    >
      <div className="toggle-thumb" style={{ left: checked && !locked ? 20 : 2 }} />
    </div>
  );
}

export function Centered({ children, maxWidth = 400 }) {
  return (
    <div className="centered" style={{ maxWidth }}>
      {children}
    </div>
  );
}

export function SettingRow({ icon: Icon, title, description, locked, checked, onChange, onLockedClick, children }) {
  return (
    <div className="setting-row">
      <div className="setting-icon">
        <Icon size={18} color="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          {locked && (
            <Badge tone="premium">
              <Lock size={10} /> PREMIUM
            </Badge>
          )}
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0", maxWidth: 440 }}>{description}</p>
        {children}
      </div>
      <Toggle checked={checked} locked={locked} onChange={onChange} onLockedClick={onLockedClick} />
    </div>
  );
}

export function StarRating({ rating, size = 20, onRate, color = "#B8872F" }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{ cursor: onRate ? "pointer" : "default" }}
          onClick={() => onRate && onRate(n)}
        >
          <path
            d="M12 2.5l2.9 6.53 7.1.62-5.4 4.73 1.63 6.98L12 17.77l-6.23 3.6 1.63-6.98L2 9.65l7.1-.62z"
            fill={n <= rating ? color : "none"}
            stroke={n <= rating ? color : "#E2E5EA"}
            strokeWidth="1.4"
          />
        </svg>
      ))}
    </div>
  );
}
