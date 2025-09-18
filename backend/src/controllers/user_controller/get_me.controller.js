import { User } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

export default async function getMe(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) throw httpError(401, "UNAUTHORIZED", "Usuário não autenticado.");

    const user = await User.findByPk(uid);
    if (!user) throw httpError(404, "NOT_FOUND", "Usuário não encontrado.");

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