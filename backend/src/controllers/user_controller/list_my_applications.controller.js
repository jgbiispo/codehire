import { z } from "zod";
import { Application, Job, Company, Tag } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["submitted", "in_review", "shortlisted", "rejected", "hired"]).optional(),
});

export default async function listMyApplications(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) throw httpError(401, "UNAUTHORIZED", "Autenticação necessária.");

    const { limit, offset, status } = querySchema.parse(req.query);

    const where = { user_id: uid };
    if (status) where.status = status;

    const { rows, count } = await Application.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: "job",
          attributes: [
            "id", "title", "slug", "location", "remote", "employment_type", "experience_level",
            "salary_min", "salary_max", "currency", "posted_at", "expires_at", "status",
          ],
          include: [
            { model: Company, as: "company", attributes: ["id", "name", "slug", "logo_url", "verified", "location"] },
            { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const items = rows.map((a) => ({
      id: a.id,
      status: a.status,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      job: a.Job && {
        id: a.Job.id,
        title: a.Job.title,
        slug: a.Job.slug,
        location: a.Job.location,
        remote: a.Job.remote,
        employmentType: a.Job.employment_type,
        experienceLevel: a.Job.experience_level,
        salary: { min: a.Job.salary_min, max: a.Job.salary_max, currency: a.Job.currency },
        postedAt: a.Job.posted_at,
        expiresAt: a.Job.expires_at,
        status: a.Job.status,
        company: a.Job.Company && {
          id: a.Job.Company.id,
          name: a.Job.Company.name,
          slug: a.Job.Company.slug,
          logoUrl: a.Job.Company.logo_url,
          verified: a.Job.Company.verified,
          location: a.Job.Company.location,
        },
        tags: a.Job.Tags?.map(t => ({ id: t.id, name: t.name, slug: t.slug, type: t.type })) || [],
      },
    }));

    return res.json({
      total: count,
      limit,
      offset,
      items,
    });
  } catch (e) {
    next(e);
  }
}
