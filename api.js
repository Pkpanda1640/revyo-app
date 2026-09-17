async function req(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export const api = {
  get: (path) => req(path),
  post: (path, body) => req(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => req(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path) => req(path, { method: "DELETE" }),
};
