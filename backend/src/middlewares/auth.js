import { getAccessTokenFromReq, verifyAccessToken } from "../lib/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const token = getAccessTokenFromReq(req);
    if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token ausente." } });
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token inválido/expirado." } });
  }
}

export function optionalAuth(req, _res, next) {
  const token = getAccessTokenFromReq(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch { /* ignore */ }
  next();
}
