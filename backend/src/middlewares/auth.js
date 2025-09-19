import { getAccessTokenFromReq, verifyAccessToken } from "../lib/jwt.js";
import { httpError } from "../server/http-error.js";

export function requireAuth(req, _res, next) {
  try {
    const token = getAccessTokenFromReq(req);
    if (typeof token !== "string" || token.length === 0) {
      throw httpError(401, "UNAUTHORIZED", "Token não fornecido.");
    }
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw httpError(401, "UNAUTHORIZED", "Token inválido ou expirado.");
    }
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    next(e);
  }
}

export function optionalAuth(req, _res, next) {
  const token = getAccessTokenFromReq(req);
  try {
    const token = getAccessTokenFromReq(req);
    if (typeof token === "string" && token.length > 0) {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role };
    }
  } catch {
    // ignora token inválido
  }
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
