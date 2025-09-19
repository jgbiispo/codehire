import { z } from "zod";
import { User, RefreshToken, sequelize } from "../../../db/sequelize.js";

const body = z.object({ role: z.enum(["candidate", "employer", "admin"]) });

export default async function setUserRole(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const uid = req.params.id;
    const { role } = body.parse(req.body);
    const u = await User.findByPk(uid, { transaction: t, lock: t.LOCK.UPDATE });
    if (!u) { await t.rollback(); return res.status(404).json({ error: { code: "NOT_FOUND" } }); }

    u.role = role;
    await u.save({ transaction: t });

    await RefreshToken.destroy({ where: { user_id: uid }, transaction: t }); // força re-login
    await t.commit();

    res.json({ user: { id: u.id, role: u.role } });
  } catch (e) { await t.rollback(); next(e); }
}
