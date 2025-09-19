import { z } from "zod";
import bcrypt from "bcrypt";
import { User, RefreshToken, sequelize } from "../../../db/sequelize.js";
import { tokensFromUser, hashToken, setAuthCookies } from "../../lib/jwt.js";
import { httpError } from "../../server/http-error.js";

export default async function register(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().transform((s) => s.toLowerCase()),
      password: z.string().min(6).max(100),
      role: z.enum(["candidate", "employer", "admin"]).optional(),
    });

    const { name, email, password, role } = schema.parse(req.body);

    const isAdminRequester = req.user?.role === "admin";

    const requestedRole = role ?? "candidate";

    if (!isAdminRequester && requestedRole === "admin") {
      throw httpError(403, "FORBIDDEN", "Não é permitido registrar como admin.");
    }

    const finalRole = isAdminRequester
      ? requestedRole
      : (requestedRole === "employer" ? "employer" : "candidate");

    const existing = await User.findOne({ where: { email }, transaction: t });
    if (existing) {
      throw httpError(409, "USER_ALREADY_EXISTS", "Usuário com este email já existe.");
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password_hash,
      role: finalRole,
    }, { transaction: t });

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

    setAuthCookies(res, { access, refresh });

    const pub = {
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatarUrl: user.avatar_url ?? null, headline: user.headline ?? null, location: user.location ?? null,
    };

    return res.status(201).json({ user: pub });
  } catch (e) {
    await t.rollback();
    return next(e);
  }
}
