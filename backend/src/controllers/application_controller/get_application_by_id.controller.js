import { z } from "zod";
import { Application, Job, Company, User, Tag } from "../../../db/sequelize.js";
import { httpError } from "../../server/http-error.js";

const pSchema = z.object({ id: z.uuid() });

export default async function getApplicationById(req, res, next) {
  try {
    const uid = req.user?.id;
    const role = req.user?.role;
    if (!uid) throw httpError(401, "UNAUTHORIZED");

    const { id } = pSchema.parse(req.params);
    const a = await Application.findByPk(id, {
      include: [
        { model: User, as: "candidate", attributes: ["id", "name", "email", "headline", "location", "avatar_url", "role"] },
        {
          model: Job, as: "job",
          attributes: ["id", "title", "slug", "status", "location", "remote", "employment_type", "experience_level", "salary_min", "salary_max", "currency", "posted_at", "company_id"],
          include: [
            { model: Company, as: "company", attributes: ["id", "name", "slug", "owner_id", "verified", "location"] },
            { model: Tag, as: "tags", attributes: ["id", "name", "slug", "type"], through: { attributes: [] } },
          ],
        },
      ],
    });

    if (!a) throw httpError(404, "NOT_FOUND");

    // ACL: candidato dono OU admin OU owner da vaga
    const isCandidate = a.user_id === uid;
    const isAdmin = role === "admin";
    const isOwner = a.job?.company?.owner_id === uid;
    if (!isCandidate && !isAdmin && !isOwner) {
      throw httpError(403, "FORBIDDEN");
    }

    const j = a.job;
    const c = a.candidate;
    return res.json({
      application: {
        id: a.id,
        status: a.status,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        resumeUrl: a.resume_url,
        coverLetterMd: a.cover_letter_md,
        answers: a.answers,
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
      },
    });
  } catch (e) {
    return next(e);
  }
}