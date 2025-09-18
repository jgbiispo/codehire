import { z } from "zod";
import { Job } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const pSchema = z.object({ id: z.uuid() });

export default async function deleteJob(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) throw httpError(401, "UNAUTHORIZED");

    const { id } = pSchema.parse(req.params);
    const job = await Job.findByPk(id);
    if (!job) throw httpError(404, "NOT_FOUND", "Vaga não encontrada.");

    const isAdmin = req.user?.role === "admin";
    const isOwner = job.company_id === uid;

    if (!isAdmin && !isOwner) {
      throw httpError(403, "FORBIDDEN", "Sem permissão para deletar esta vaga.");
    }

    await job.destroy();
    return res.status(204).send();
  } catch (e) {
    next(e);
  }
}