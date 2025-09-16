import 'dotenv/config';
import { z } from "zod";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

import { User, RefreshToken, sequelize } from "../../../db/sequelize.js";
import { signAccess, signRefresh, setAuthCookies, REFRESH_TTL_MS } from "./utils.js";

export default async function register(req, res) {
  const t = await sequelize.transaction();

  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.email(),
      password: z.string().min(6).max(100),
      role: z.enum(["candidate", "employer", "admin"]).optional(),
    });

    const { name, email, password } = schema.parse(req.body);
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash, role: "candidate" });

    await user.reload({ transaction: t });

    const uid = user?.id;
    if (!uid) {
      await t.rollback();
      return res.status(500).json({ error: { code: "NO_USER_ID", message: "Não foi possível obter o id do usuário recém-criado." } });
    }

    const jti = randomUUID();
    const refreshRaw = signRefresh(uid);
    const token_hash = await bcrypt.hash(refreshRaw, 10);

    await RefreshToken.create({
      id: jti,
      user_id: uid,
      token_hash,
      user_agent: req.get("user-agent") || "",
      ip: (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString(),
      expires_at: new Date(Date.now() + REFRESH_TTL_MS),
    }, { transaction: t });

    await t.commit();

    const access = signAccess(uid);
    setAuthCookies(res, access, refreshRaw);

    const pub = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url ?? null,
      headline: user.headline ?? null,
      location: user.location ?? null,
    };

    res.status(201).json({ user: pub });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}