// src/lib/jwt.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

const isProd = process.env.NODE_ENV === "production";
const ACCESS_TTL_MS = Number(process.env.AUTH_ACCESS_TTL_MS || 15 * 60 * 1000);
const REFRESH_TTL_MS = Number(process.env.AUTH_REFRESH_TTL_MS || 30 * 24 * 60 * 60 * 1000);

const ACCESS_SECRET = process.env.AUTH_ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.AUTH_REFRESH_TOKEN_SECRET;
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.warn("[jwt] WARNING: faltando AUTH_ACCESS_TOKEN_SECRET/ AUTH_REFRESH_TOKEN_SECRET no .env");
}

export function signAccessToken({ sub, role }) {
  return jwt.sign({ sub, role }, ACCESS_SECRET, { expiresIn: Math.floor(ACCESS_TTL_MS / 1000) });
}

export function signRefreshToken({ sub, role, jti }) {
  return jwt.sign({ sub, role, jti }, REFRESH_SECRET, { expiresIn: Math.floor(REFRESH_TTL_MS / 1000) });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

export function newJti() {
  return randomUUID();
}

export function hashToken(raw) {
  return bcrypt.hash(raw, 10);
}

export function tokensFromUser(user) {
  const jti = newJti();
  const access = signAccessToken({ sub: user.id, role: user.role });
  const refresh = signRefreshToken({ sub: user.id, role: user.role, jti });
  return { access, refresh, jti };
}

function isValidCookieDomain(input) {
  if (!input) return false;
  const d = String(input).trim();
  if (d.startsWith("http")) return false;
  if (d.includes(":")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d)) return false;
  return /^[a-zA-Z0-9.-]+$/.test(d);
}

export function setAuthCookies(res) {
  const domainEnv = process.env.COOKIE_DOMAIN;
  const domain = isValidCookieDomain(domainEnv) ? domainEnv : undefined;

  const secure = process.env.COOKIE_SECURE === "true";
  const sameSite = process.env.COOKIE_SAMESITE || "lax";

  const base = {
    httpOnly: true,
    path: "/",
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
  };

  res.cookie("access_token", access, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", refresh, { ...base, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/", domain: COOKIE_DOMAIN });
  res.clearCookie("refresh_token", { path: "/", domain: COOKIE_DOMAIN });
}

export function getAccessTokenFromReq(req) {
  const c = req.signedCookies?.access_token || req.cookies?.access_token;
  if (c) return c;
  const h = req.get("authorization");
  const m = h && h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function getRefreshTokenFromReq(req) {
  const cookie = req.cookies?.refresh_token;
  const header = req.get("x-refresh-token"); // fallback
  return cookie || header || null;
}
