import { z } from 'zod';
import bcrypt from 'bcrypt';
import { User } from '../../../db/sequelize.js';

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

export default async function patchMe(req, res) {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token ausente." } });

    const updates = bodyScheme.parse(req.body);
    const user = await User.findByPk(uid);
    if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Usuário não encontrado." } });

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.headline !== undefined) user.headline = updates.headline;
    if (updates.location !== undefined) user.location = updates.location;
    if (updates.avatarUrl !== undefined) user.avatar_url = updates.avatarUrl;

    if (updates.currentPassword && updates.newPassword) {
      const ok = await bcrypt.compare(updates.currentPassword, user.password_hash);
      if (!ok) return res.status(400).json({ error: { code: "WRONG_PASSWORD", message: "Senha atual incorreta." } });
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
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: e.errors } });
    }
    console.error("[user.patchMe]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
}
