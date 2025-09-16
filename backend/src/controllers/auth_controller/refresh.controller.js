import bcrypt from "bcrypt";
import { getRefreshTokenFromReq, verifyRefreshToken, tokensFromUser, hashToken, setAuthCookies } from "../../lib/jwt.js";
import { RefreshToken, User, sequelize } from "../../../db/sequelize.js";

export default async function refresh(req, res) {
  const t = await sequelize.transaction();
  try {
    const raw = getRefreshTokenFromReq(req);
    if (!raw) {
      await t.rollback();
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Refresh token ausente." } });
    }

    let payload;
    try {
      payload = verifyRefreshToken(raw); // { sub, role, jti, iat, exp }
    } catch {
      await t.rollback();
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Refresh token inválido." } });
    }

    // Confere existência/estado do refresh no DB
    const stored = await RefreshToken.findOne({ where: { id: payload.jti }, transaction: t, lock: t.LOCK.UPDATE });
    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
      await t.rollback();
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Refresh token revogado/expirado." } });
    }

    // Proteção adicional: comparar hash
    const ok = await bcrypt.compare(raw, stored.token_hash);
    if (!ok) {
      await t.rollback();
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token não reconhecido." } });
    }

    // Rotação: revoga o antigo
    await RefreshToken.update({ revoked_at: new Date() }, { where: { id: stored.id }, transaction: t });

    // Cria novo par de tokens
    const user = await User.findByPk(payload.sub, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Usuário não encontrado." } });
    }

    const { access, refresh, jti } = tokensFromUser(user);
    const token_hash = await hashToken(refresh);

    await RefreshToken.create({
      id: jti,
      user_id: user.id,
      token_hash,
      user_agent: req.get("user-agent") || "",
      ip: (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString(),
      expires_at: new Date(Date.now() + Number(process.env.AUTH_REFRESH_TTL_MS || 30 * 24 * 60 * 60 * 1000)),
    }, { transaction: t });

    await t.commit();

    setAuthCookies(res, access, refresh);
    const pub = {
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatarUrl: user.avatar_url ?? null, headline: user.headline ?? null, location: user.location ?? null,
    };
    return res.status(200).json({ user: pub });
  } catch (e) {
    await t.rollback();
    console.error("[refresh]", e);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
  }
}
