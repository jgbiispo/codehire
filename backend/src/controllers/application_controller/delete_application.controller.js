import { z } from "zod";
import { Application } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const pSchema = z.object({ id: z.uuid() });

export default async function deleteApplication(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) throw httpError(401, "UNAUTHORIZED");

    const { id } = pSchema.parse(req.params);
    const app = await Application.findByPk(id);
    if (!app) throw httpError(404, "NOT_FOUND");

    if (app.user_id !== uid) {
      throw httpError(403, "FORBIDDEN");
    }
    if (app.status !== "submitted") {
      throw httpError(400, "BAD_REQUEST", "Só é possível remover candidaturas com status 'submitted'.");
    }

    await app.destroy();
    return res.status(204).send();
  } catch (e) {
    return next(e);
  }
}
