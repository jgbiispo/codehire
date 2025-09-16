import { z } from "zod";
import { Application, Job, Company } from "../../../db/sequelize.js";

const pSchema = z.object({ id: z.uuid() });
const bSchema = z.object({
  status: z.enum(["submitted", "in_review", "shortlisted", "rejected", "hired"]),
});

export default async function updateApplicationStatus(req, res) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) return res.status(401).json({ error: { code: "UNAUTHORIZED" } });

    const { id } = pSchema.parse(req.params);
    const { status } = bSchema.parse(req.body);

    const app = await Application.findByPk(id, {
      include: [{ model: Job, as: "job", include: [{ model: Company, as: "company", attributes: ["owner_id"] }] }],
    });
    if (!app) return res.status(404).json({ error: { code: "NOT_FOUND" } });

    const isAdmin = role === "admin";
    const isOwner = app.job?.company?.owner_id === uid;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: { code: "FORBIDDEN" } });

    app.status = status;
    await app.save();

    return res.json({ application: { id: app.id, status: app.status, updatedAt: app.updated_at } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", details: e.errors } });
    }
    console.error("[applications.updateStatus]", e);
    return res.status(500).json({ error: { code: "INTERNAL" } });
  }
}
