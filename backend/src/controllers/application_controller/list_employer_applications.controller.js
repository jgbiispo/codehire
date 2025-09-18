import { z } from "zod";
import { Op, Sequelize } from "sequelize";
import { Application, Job, Company, User, Tag } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const qSchema = z.object({
  jobId: z.uuid().optional(),
  status: z.enum(["submitted", "in_review", "shortlisted", "rejected", "hired"]).optional(),
  q: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  order: z.enum(["recent", "oldest"]).default("recent"),
});

export default async function listEmployerApplications(req, res, next) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) throw httpError(401, "UNAUTHORIZED");

    const { jobId, status, q, limit, offset, order } = qSchema.parse(req.query);

    // Admin vê tudo; employer só vê das empresas que possui
    const whereApp = {};
    if (status) whereApp.status = status;

    // Filtro por ownership
    const includeJob = {
      model: Job,
      as: "job",
      attributes: ["id", "title", "slug", "status", "company_id", "employment_type", "experience_level", "location", "remote", "salary_min", "salary_max", "currency", "posted_at"],
      include: [
        { model: Company, as: "company", attributes: ["id", "name", "slug", "owner_id", "verified", "location"] },
        { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
      ],
      required: true,
      where: {},
    };
    if (jobId) includeJob.where.id = jobId;

    const includeCandidate = {
      model: User,
      as: "candidate",
      attributes: ["id", "name", "email", "headline", "location", "avatar_url", "role"],
      where: {},
      required: true,
    };
    if (q) {
      includeCandidate.where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await Application.findAndCountAll({
      where: whereApp,
      include: [includeJob, includeCandidate],
      attributes: {
        include: [
          [Sequelize.literal(`"Application"."created_at"`), "created_at_alias"]
        ],
      },
      order: [[Sequelize.literal(`created_at_alias`), order === "recent" ? "DESC" : "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    const filteredRows = role === "admin"
      ? rows
      : rows.filter(a => a.job?.company?.owner_id === uid);

    const items = filteredRows.map((a) => {
      const j = a.job;
      const c = a.candidate;
      return {
        id: a.id,
        status: a.status,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        candidate: c && {
          id: c.id, name: c.name, email: c.email, headline: c.headline, location: c.location, avatarUrl: c.avatar_url,
        },
        job: j && {
          id: j.id, title: j.title, slug: j.slug, status: j.status, location: j.location, remote: j.remote,
          employmentType: j.employment_type, experienceLevel: j.experience_level,
          salary: { min: j.salary_min, max: j.salary_max, currency: j.currency },
          postedAt: j.posted_at,
          company: j.company && {
            id: j.company.id, name: j.company.name, slug: j.company.slug, verified: j.company.verified, ownerId: j.company.owner_id, location: j.company.location,
          },
          tags: j.tags?.map(t => ({ id: t.id, name: t.name, slug: t.slug, type: t.type })) || [],
        },
      };
    });

    const total = role === "admin" ? count : items.length;

    return res.json({ total, limit, offset, items });
  } catch (e) {
    return next(e);
  }
}
