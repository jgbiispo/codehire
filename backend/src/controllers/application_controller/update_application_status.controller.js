import { z } from "zod";
import { Application, Job, Company } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const pSchema = z.object({ id: z.uuid() });
const bSchema = z.object({
  status: z.enum(["submitted", "in_review", "shortlisted", "rejected", "hired"]),
});

export default async function updateApplicationStatus(req, res, next) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) throw new httpError(401, "UNAUTHORIZED");

    const { id } = pSchema.parse(req.params);
    const { status } = bSchema.parse(req.body);

    const app = await Application.findByPk(id, {
      include: [{ model: Job, as: "job", include: [{ model: Company, as: "company", attributes: ["owner_id"] }] }],
    });
    if (!app) throw new httpError(404, "NOT_FOUND");

    const isAdmin = role === "admin";
    const isOwner = app.job?.company?.owner_id === uid;
    if (!isAdmin && !isOwner) throw new httpError(403, "FORBIDDEN", "Sem permissão para atualizar esta aplicação.");

    app.status = status;
    await app.save();

    return res.json({ application: { id: app.id, status: app.status, updatedAt: app.updated_at } });
  } catch (e) {
    next(e);
  }
}
