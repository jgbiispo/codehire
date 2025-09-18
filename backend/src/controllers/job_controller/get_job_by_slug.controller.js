import { z } from "zod";
import { Op } from "sequelize";
import { Company, Job, Tag, Bookmark } from "../../../db/sequelize.js";

const paramsSchema = z.object({ slug: z.string().min(1) });

export default async function getJobBySlug(req, res, next) {
  try {
    const { slug } = paramsSchema.parse(req.params);
    const uid = req.user?.id || null;

    const job = await Job.findOne({
      where: {
        slug,
        status: "approved",
        [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
      },
      include: [
        { model: Company, as: "company", attributes: ["id", "name", "slug", "logo_url", "website", "verified", "location"] },
        { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
      ],
    });

    if (!job) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Vaga não encontrada." } });
    }

    let bookmarked = false;
    if (uid) {
      const bm = await Bookmark.findOne({ where: { user_id: uid, job_id: job.id }, attributes: ["created_at"] });
      bookmarked = !!bm;
    }

    const j = job.get({ plain: true });
    const pub = {
      id: j.id,
      title: j.title,
      slug: j.slug,
      description: j.description_md,
      employmentType: j.employment_type,
      experienceLevel: j.experience_level,
      salary: { min: j.salary_min, max: j.salary_max, currency: j.currency },
      remote: j.remote,
      timezone: j.timezone,
      visaSponsorship: j.visa_sponsorship,
      location: j.location,
      status: j.status,
      featuredUntil: j.featured_until,
      postedAt: j.posted_at,
      expiresAt: j.expires_at,
      company: j.company && {
        id: j.company.id,
        name: j.company.name,
        slug: j.company.slug,
        logoUrl: j.company.logo_url,
        website: j.company.website,
        verified: j.company.verified,
        location: j.company.location,
      },
      tags: (j.tags || []).map(tg => ({ id: tg.id, name: tg.name, slug: tg.slug, type: tg.type })),
      bookmarked,
    };

    return res.json({ job: pub });
  } catch (e) {
    next(e);
  }
}
