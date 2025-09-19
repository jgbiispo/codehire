// src/lib/jwt.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

const isProd = process.env.NODE_ENV === "production";

const ACCESS_TTL_MS = Number(process.env.AUTH_ACCESS_TTL_MS || 15 * 60 * 1000);         // 15 min
const REFRESH_TTL_MS = Number(process.env.AUTH_REFRESH_TTL_MS || 30 * 24 * 60 * 60 * 1000); // 30 dias
const ACCESS_TTL_S = Math.floor(ACCESS_TTL_MS / 1000);
const REFRESH_TTL_S = Math.floor(REFRESH_TTL_MS / 1000);

const ACCESS_SECRET = process.env.AUTH_ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.AUTH_REFRESH_TOKEN_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.warn("[jwt] WARNING: faltando AUTH_ACCESS_TOKEN_SECRET/ AUTH_REFRESH_TOKEN_SECRET no .env");
}

export function signAccessToken({ sub, role }) {
  return jwt.sign({ sub, role }, ACCESS_SECRET, { expiresIn: ACCESS_TTL_S });
}

export function signRefreshToken({ sub, role, jti }) {
  return jwt.sign({ sub, role, jti }, REFRESH_SECRET, { expiresIn: REFRESH_TTL_S });
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

// ----- Cookies helpers -----
function isValidCookieDomain(input) {
  if (!input) return false;
  const d = String(input).trim();
  if (d.startsWith("http")) return false;                        // URL não
  if (d.includes(":")) return false;                             // porta não
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d)) return false;           // IP v4 não
  return /^[a-zA-Z0-9.-]+$/.test(d);                             // hostname
}

function computeCookieBaseOptions() {
  const domainEnv = process.env.COOKIE_DOMAIN;
  const domain = isValidCookieDomain(domainEnv) ? domainEnv : undefined;

  const secure = process.env.COOKIE_SECURE === "true" || false;
  const sameSiteEnv = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();

  const sameSite = (sameSiteEnv === "none" && !secure) ? "lax" : sameSiteEnv;

  if (sameSiteEnv === "none" && !secure) {
    console.warn("[cookies] COOKIE_SAMESITE=none exige COOKIE_SECURE=true. Caindo para SameSite=Lax.");
  }

  return {
    httpOnly: true,
    path: "/",
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
  };
}

export function setAuthCookies(res, access, refresh) {
  const base = computeCookieBaseOptions();
  res.cookie("access_token", access, { ...base, maxAge: ACCESS_TTL_MS });
  res.cookie("refresh_token", refresh, { ...base, maxAge: REFRESH_TTL_MS });
}

export function clearAuthCookies(res) {
  const base = computeCookieBaseOptions();
  res.clearCookie("access_token", base);
  res.clearCookie("refresh_token", base);
}

export function getAccessTokenFromReq(req) {
  const c = req.signedCookies?.access_token || req.cookies?.access_token;
  if (c) return c;

  const h = req.get("authorization");
  const m = h && h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function getRefreshTokenFromReq(req) {
  const c = req.signedCookies?.refresh_token || req.cookies?.refresh_token;
  if (c) return c;
  const header = req.get("x-refresh-token");
  return header || null;
}
