import 'dotenv/config';
import { randomUUID } from "node:crypto";

export const ACCESS_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d
export const isProd = process.env.NODE_ENV === "production";
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;

export const signAccess = (uid) => `dev-access-${uid}-${Date.now()}`;
export const signRefresh = (uid) => `dev-refresh-${uid}-${randomUUID()}`;

export function setAuthCookies(res, access, refresh) {
  res.cookie("access_token", access, {
    httpOnly: true, secure: isProd, sameSite: "lax", path: "/", domain: COOKIE_DOMAIN, maxAge: ACCESS_TTL_MS,
  });
  res.cookie("refresh_token", refresh, {
    httpOnly: true, secure: isProd, sameSite: "lax", path: "/", domain: COOKIE_DOMAIN, maxAge: REFRESH_TTL_MS,
  });
}