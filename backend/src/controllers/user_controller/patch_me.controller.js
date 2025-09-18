import { z } from 'zod';
import bcrypt from 'bcrypt';
import { User } from '../../../db/sequelize.js';
import { httpError } from "../../server/http-error.js";

const bodyScheme = z.object({
  name: z.string().min(2).max(100).optional(),
  headline: z.string().max(200).optional(),
  location: z.string().max(120).optional(),
  avatarUrl: z.url().optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6).optional(),
}).refine(
  (data) =>
    (!data.currentPassword && !data.newPassword) ||
    (Boolean(data.currentPassword) && Boolean(data.newPassword)),
  { message: "Para alterar a senha, envie currentPassword e newPassword." }
);

export default async function patchMe(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) throw httpError(401, "UNAUTHORIZED", "Token ausente.");

    const updates = bodyScheme.parse(req.body);
    const user = await User.findByPk(uid);
    if (!user) throw httpError(404, "NOT_FOUND", "Usuário não encontrado.");

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.headline !== undefined) user.headline = updates.headline;
    if (updates.location !== undefined) user.location = updates.location;
    if (updates.avatarUrl !== undefined) user.avatar_url = updates.avatarUrl;

    if (updates.currentPassword && updates.newPassword) {
      const ok = await bcrypt.compare(updates.currentPassword, user.password_hash);
      if (!ok) throw httpError(400, "INVALID_PASSWORD", "Senha atual incorreta.");
      user.password_hash = await bcrypt.hash(updates.newPassword, 12);
    }

    await user.save();

    const pub = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url ?? null,
      headline: user.headline ?? null,
      location: user.location ?? null,
    };

    return res.json({ user: pub });

  } catch (e) {
    next(e);
  }
}
