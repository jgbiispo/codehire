import { z } from "zod";
import { sequelize, Job } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({
  reason: z.string().max(2000).optional(),
});

export default async function rejectJob(req, res, next) {
  try {
    if (req.user?.role !== "admin") throw httpError(403, "FORBIDDEN", "Apenas administradores.");

    const { id } = paramsSchema.parse(req.params);
    const { reason } = bodySchema.parse(req.body ?? {});

    const result = await sequelize.transaction(async (t) => {
      const job = await Job.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!job) throw httpError(404, "JOB_NOT_FOUND", "Vaga não encontrada.");
      if (job.status === "approved") {
        throw httpError(409, "INVALID_STATE", "Não é possível rejeitar uma vaga já aprovada.");
      }

      job.status = "rejected";
      await job.save({ transaction: t });

      return job.get({ plain: true });
    });

    return res.json({
      id: result.id,
      title: result.title,
      slug: result.slug,
      status: result.status, // rejected
      reason: reason ?? null,
    });
  } catch (e) {
    return next(e);
  }
}
