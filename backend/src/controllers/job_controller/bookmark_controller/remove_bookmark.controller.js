import { z } from "zod";
import { Bookmark } from "../../../../db/sequelize.js";
import { httpError } from "../../../server/http-error.js";

const paramsSchema = z.object({ id: z.uuid() });

export default async function unbookmarkJob(req, res, next) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;

    if (!uid) throw httpError(401, "UNAUTHORIZED", "Token ausente.");
    if (role !== "candidate") throw httpError(403, "FORBIDDEN", "Apenas candidatos podem remover favoritos.");

    const { id: jobId } = paramsSchema.parse(req.params);

    await Bookmark.destroy({ where: { user_id: uid, job_id: jobId } });
    return res.status(204).send();
  } catch (e) {
    next(e);
  }
}
