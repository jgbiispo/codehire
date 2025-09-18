import { z } from "zod";
import { sequelize, Job, Application } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  resumeUrl: z.url(),
  coverLetterMd: z.string().max(20000).optional(),
  answers: z.partialRecord(z.string(), z.unknown()).optional(),
});

export default async function applyToJob(req, res, next) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) throw httpError(401, "UNAUTHORIZED");
    if (role !== "candidate") throw httpError(403, "FORBIDDEN", "Apenas candidatos podem se candidatar a vagas.");

    const { id: jobId } = paramsSchema.parse(req.params);
    const { resumeUrl, coverLetterMd, answers } = bodySchema.parse(req.body);

    const app = await sequelize.transaction(async (t) => {
      const job = await Job.findByPk(jobId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!job) throw httpError(404, "JOB_NOT_FOUND", "Vaga não encontrada.");

      if (job.status !== "approved") throw httpError(400, "JOB_NOT_OPEN", "Vaga não está aberta para candidaturas.");
      if (job.expires_at && new Date(job.expires_at) < new Date()) {
        throw httpError(400, "JOB_EXPIRED", "Vaga expirada.");
      }

      return await Application.create(
        {
          job_id: job.id,
          user_id: uid,
          resume_url: resumeUrl,
          cover_letter_md: coverLetterMd || null,
          answers: answers || null,
          status: "submitted",
        },
        { transaction: t }
      );
    });

    return res.status(201).json({
      application: {
        id: app.id,
        jobId: app.job_id,
        userId: app.user_id,
        status: app.status,
        resumeUrl: app.resume_url,
        coverLetterMd: app.cover_letter_md,
        createdAt: app.created_at ?? null,
      },
    });
  } catch (e) {
    return next(e);
  }
}
