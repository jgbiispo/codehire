import { z } from "zod";
import { sequelize, Job } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({
  postedAt: z.coerce.date().optional(),
  featuredUntil: z.coerce.date().optional(),
});

export default async function approveJob(req, res, next) {
  try {
    if (req.user?.role !== "admin") throw httpError(403, "FORBIDDEN", "Apenas administradores.");

    const { id } = paramsSchema.parse(req.params);
    const { postedAt, featuredUntil } = bodySchema.parse(req.body ?? {});

    const result = await sequelize.transaction(async (t) => {
      const job = await Job.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!job) throw httpError(404, "JOB_NOT_FOUND", "Vaga não encontrada.");

      job.status = "approved";
      if (!job.posted_at) job.posted_at = postedAt ?? new Date();
      if (featuredUntil !== undefined) job.featured_until = featuredUntil;

      await job.save({ transaction: t });

      return job.get({ plain: true });
    });

    return res.json({
      id: result.id,
      title: result.title,
      slug: result.slug,
      status: result.status,
      postedAt: result.posted_at,
      featuredUntil: result.featured_until,
    });
  } catch (e) {
    return next(e);
  }
}
