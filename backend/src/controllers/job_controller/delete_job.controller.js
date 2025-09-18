import { z } from "zod";
import { Job } from "../../../db/sequelize.js";

const pSchema = z.object({ id: z.uuid() });

export default async function deleteJob(req, res) {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED" } });

    const { id } = pSchema.parse(req.params);
    const job = await Job.findByPk(id);
    if (!job) return res.status(404).json({ error: { code: "NOT_FOUND" } });

    const isAdmin = req.user?.role === "admin";
    const isOwner = job.company_id === uid;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Você não pode remover esta vaga." } });
    }

    await job.destroy();
    return res.status(204).send();
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: e.errors } });
    }
    console.error("[jobs.delete]", { requestId: req.id, error: e });
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}