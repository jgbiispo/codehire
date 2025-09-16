import { z } from "zod";
import bcrypt from "bcrypt";
import { User, RefreshToken, sequelize } from "../../../db/sequelize.js";
import { tokensFromUser, hashToken, setAuthCookies } from "../../lib/jwt.js";

export default async function register(req, res) {
  const t = await sequelize.transaction();
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.email().transform((s) => s.toLowerCase()),
      password: z.string().min(6).max(100),
      role: z.enum(["candidate", "employer", "admin"]).optional(),
    });

    const { name, email, password, role } = schema.parse(req.body);

    const existing = await User.findOne({ where: { email }, transaction: t, lock: t.LOCK.UPDATE });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: { code: "EMAIL_TAKEN", message: "Email already in use" } });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password_hash, role: role || "candidate" }, { transaction: t });
    await user.reload({ transaction: t });

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
    return res.status(201).json({ user: pub });
  } catch (e) {
    await t.rollback();
    console.error("[register]", e);
    return res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
  }
}
