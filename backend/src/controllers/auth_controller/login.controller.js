import { z } from "zod";
import bcrypt from "bcrypt";
import { User, RefreshToken, sequelize } from "../../../db/sequelize.js";
import { tokensFromUser, hashToken, setAuthCookies } from "../../lib/jwt.js";
import { httpError } from "../../server/http-error.js";

export default async function login(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const schema = z.object({
      email: z.email().transform((s) => s.toLowerCase()),
      password: z.string().min(1),
    });
    const { email, password } = schema.parse(req.body);

    const user = await User.findOne({ where: { email }, transaction: t, lock: t.LOCK.UPDATE });
    if (!user) {
      await t.rollback();
      throw httpError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      await t.rollback();
      throw httpError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
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
    return next(e);
  }
}
