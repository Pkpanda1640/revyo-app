import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

const COOKIE_NAME = "revyo_session";

export function createSessionCookie(payload) {
  const token = jwt.sign(payload, process.env.SESSION_SECRET, { expiresIn: "30d" });
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  return serialize(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function getSession(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.SESSION_SECRET);
  } catch {
    return null;
  }
}
