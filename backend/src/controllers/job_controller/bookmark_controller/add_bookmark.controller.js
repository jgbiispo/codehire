import { z } from "zod";
import { sequelize, Job, Bookmark } from "../../../../db/sequelize.js";
import { httpError } from "../../../server/http-error.js";

const paramsSchema = z.object({ id: z.uuid() });

export default async function addBookmarkJob(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) {
      await t.rollback();
      throw httpError(401, "UNAUTHORIZED", "Token ausente.");
    }

    if (role !== "candidate") {
      await t.rollback();
      throw httpError(403, "FORBIDDEN", "Apenas candidatos podem salvar vagas.");
    }

    const { id: jobId } = paramsSchema.parse(req.params);

    const job = await Job.findByPk(jobId, {
      attributes: ["id", "status", "expires_at"],
      transaction: t,
      lock: { level: t.LOCK.UPDATE, of: Job },
    });
    if (!job) {
      await t.rollback();
      throw httpError(404, "NOT_FOUND", "Vaga não encontrada.");
    }
    const isExpired = job.expires_at && new Date(job.expires_at) < new Date();
    if (job.status !== "approved") {
      await t.rollback();
      throw httpError(400, "JOB_INACTIVE", "Vaga não está ativa.");
    }
    if (isExpired) {
      await t.rollback();
      throw httpError(400, "JOB_EXPIRED", "Vaga expirada.");
    }

    const [row, created] = await Bookmark.findOrCreate({
      where: { user_id: uid, job_id: jobId },
      defaults: { created_at: new Date() },
      transaction: t,
    });

    await t.commit();
    return res.status(created ? 201 : 200).json({
      bookmarked: true,
      jobId,
      bookmarkedAt: row.created_at,
      created: !!created,
    });
  } catch (e) {
    await t.rollback();
    next(e);
  }
}
