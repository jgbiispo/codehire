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

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
    maxAge: ACCESS_TTL_MS,
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
    maxAge: REFRESH_TTL_MS,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/", domain: COOKIE_DOMAIN });
  res.clearCookie("refresh_token", { path: "/", domain: COOKIE_DOMAIN });
}

export function getAccessTokenFromReq(req) {
  const cookie = req.cookies?.access_token;
  const header = req.get("authorization"); // "Bearer ..." (opcional)
  if (cookie) return cookie;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function getRefreshTokenFromReq(req) {
  const cookie = req.cookies?.refresh_token;
  const header = req.get("x-refresh-token"); // fallback
  return cookie || header || null;
}
