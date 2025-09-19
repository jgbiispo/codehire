import { getAccessTokenFromReq, verifyAccessToken } from "../lib/jwt.js";
import { httpError } from "../server/http-error.js";
import jwt from "jsonwebtoken";

function verifyAccess(token) {
  if (!token) return null;
  try {
    const secret = process.env.AUTH_ACCESS_SECRET;
    if (!secret) throw new Error("Missing AUTH_ACCESS_SECRET");
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export function requireAuth(req, _res, next) {
  try {
    const token = getAccessTokenFromReq(req);
    if (!token) throw httpError(401, "UNAUTHORIZED", "Token não fornecido.");
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email ?? null };
    next();
  } catch (e) {
    next(e);
  }
}


export function optionalAuth(req, _res, next) {
  const token = getAccessTokenFromReq(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role, email: payload.email ?? null };
    } catch { /* anônimo */ }
  }
  next();
}

export function requireRole(...allowed) {
  return function (req, res, next) {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Permissão insuficiente.", requestId: req.id },
      });
    }
    next();
  };
}
