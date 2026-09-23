// Central place for plan logic, used by both admin and business-facing code
// so "is this business currently paying" is calculated the same way everywhere.

export const PLAN_LABELS = {
  free: "Free",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  lifetime: "Lifetime",
};

export const PLAN_DURATION_DAYS = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
  // lifetime and free intentionally have no duration
};

// Given a plan name, returns the ISO date it should expire from right now,
// or null if the plan has no expiry (free, lifetime).
export function planExpiryFromNow(plan) {
  const days = PLAN_DURATION_DAYS[plan];
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// The single source of truth for "does this business currently have paid features".
export function isPlanActive(client) {
  if (!client) return false;
  if (client.plan === "lifetime") return true;
  if (!client.plan || client.plan === "free") return false;
  if (!client.plan_expires_at) return false;
  return new Date(client.plan_expires_at).getTime() > Date.now();
}
