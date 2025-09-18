import { z } from "zod";
import { sequelize, Job, Application } from "../../../db/sequelize.js";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({
  resumeUrl: z.url(),
  coverLetterMd: z.string().max(20000).optional(),
  answers: z.record(z.any()).optional(),
});

export default async function applyToJob(req, res) {
  const t = await sequelize.transaction();
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) { await t.rollback(); return res.status(401).json({ error: { code: "UNAUTHORIZED" } }); }
    if (role !== "candidate") { await t.rollback(); return res.status(403).json({ error: { code: "FORBIDDEN", message: "Apenas candidatos podem se aplicar." } }); }

    const { id: jobId } = paramsSchema.parse(req.params);
    const { resumeUrl, coverLetterMd, answers } = bodySchema.parse(req.body);

    const job = await Job.findByPk(jobId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!job) { await t.rollback(); return res.status(404).json({ error: { code: "NOT_FOUND", message: "Vaga não encontrada." } }); }

    if (job.status !== "approved") { await t.rollback(); return res.status(400).json({ error: { code: "JOB_NOT_OPEN", message: "Vaga não está aberta para candidaturas." } }); }
    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      await t.rollback(); return res.status(400).json({ error: { code: "JOB_EXPIRED", message: "Vaga expirada." } });
    }

    const app = await Application.create({
      job_id: job.id,
      user_id: uid,
      resume_url: resumeUrl,
      cover_letter_md: coverLetterMd || null,
      answers: answers || null,
      status: "submitted",
    }, { transaction: t });

    await t.commit();

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
    await sequelize.transaction(async () => { }); // no-op to satisfy linter
    await t.rollback();
    if (e?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: { code: "ALREADY_APPLIED", message: "Você já se candidatou para esta vaga." } });
    }
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: e.errors } });
    }
    console.error("[applyToJob.error]", { requestId: req.id, e });
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
