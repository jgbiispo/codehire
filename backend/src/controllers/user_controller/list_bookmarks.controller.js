import { z } from "zod";
import { Bookmark, Job, Company, Tag } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["approved", "pending", "draft", "rejected", "expired"]).optional(),
});

export default async function listBookmarks(req, res, next) {
  try {
    const uid = req.user?.id;
    if (!uid) throw httpError(401, "UNAUTHORIZED", "Token ausente.");

    const { limit, offset, status } = querySchema.parse(req.query);

    const whereJob = {};
    if (status) whereJob.status = status;

    const { rows, count } = await Bookmark.findAndCountAll({
      where: { user_id: uid },
      include: [
        {
          model: Job,
          as: "job",
          required: true,
          where: whereJob,
          attributes: [
            "id", "title", "slug", "location", "remote", "employment_type", "experience_level",
            "salary_min", "salary_max", "currency", "posted_at", "expires_at", "featured_until", "status",
            "company_id"
          ],
          include: [
            { model: Company, as: "company", attributes: ["id", "name", "slug", "logo_url", "verified", "location"] }, // 👈 alias
            { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },       // 👈 alias
          ],
        },
      ],
      attributes: ["created_at"],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const items = rows.map((b) => {
      const j = b.job;
      return {
        id: j.id,
        title: j.title,
        slug: j.slug,
        location: j.location,
        remote: j.remote,
        employmentType: j.employment_type,
        experienceLevel: j.experience_level,
        salary: { min: j.salary_min, max: j.salary_max, currency: j.currency },
        postedAt: j.posted_at,
        expiresAt: j.expires_at,
        featuredUntil: j.featured_until,
        status: j.status,
        bookmarkedAt: b.created_at,
        company: j.company && {
          id: j.company.id,
          name: j.company.name,
          slug: j.company.slug,
          logoUrl: j.company.logo_url,
          verified: j.company.verified,
          location: j.company.location,
        },
        tags: j.tags?.map(t => ({ id: t.id, name: t.name, slug: t.slug, type: t.type })) || [],
      };
    });

    return res.json({ total: count, limit, offset, items });
  } catch (e) {
    next(e);
  }
}
