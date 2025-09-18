import { User } from "../../../db/sequelize.js";

export default async function getMe(req, res) {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token ausente." } });

    const user = await User.findByPk(uid);
    if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Usuário não encontrado." } });

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
    console.error("[user.getMe]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL", message: "Erro inesperado." } });
  }
}