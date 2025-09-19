import express from "express";
import { auth, user, company, application, job, feed, tag, admin } from "./controllers/index.js";
import { dbHealth } from "../db/sequelize.js";
import { requireAuth, optionalAuth, requireRole } from "./middlewares/auth.js";
import { ensureCompanyOwner, ensureJobOwner } from "./middlewares/permissions.js";

const router = express.Router();

// Health check
router.get("/health", async (req, res) => {
  try {
    await dbHealth();
    res.status(200).json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

/* ========== AUTH ========== */
router.post("/register", optionalAuth, auth.register);
router.post("/login", auth.login);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);

/* ========== USER ========== */
router.get("/me", requireAuth, user.getMe);
router.patch("/me", requireAuth, user.patchMe);
router.get("/me/bookmarks", requireAuth, user.list_bookmarks);
router.get("/me/applications", requireAuth, user.list_my_applications);

/* ========== COMPANIES ========== */
router.get("/companies", company.listCompanies);
router.get("/companies/:slug", company.getCompanyBySlug);
router.post("/companies", requireAuth, requireRole("employer", "admin"), company.createCompany);
router.patch(
  "/companies/:id",
  requireAuth,
  ensureCompanyOwner({ from: "params", field: "id" }),
  company.updateCompany
);
router.post(
  "/companies/:id/verify",
  requireAuth,
  requireRole("admin"),
  company.verifyCompany
);

/* ========== UPLOADS S3 ========== */
router.post("/uploads/presign", requireAuth, (req, res) => { /* TODO */ });

/* ========== JOBS ========== */
router.post(
  "/jobs",
  requireAuth,
  requireRole("employer", "admin"),
  ensureCompanyOwner({ from: "body", field: "companyId" }),
  job.createJob
);

router.get("/jobs", optionalAuth, job.listJobs);
router.get("/jobs/:slug", optionalAuth, job.getJobBySlug);

router.patch(
  "/jobs/:id",
  requireAuth,
  ensureJobOwner({ from: "params", field: "id" }), // admin passa; senão, dono do job (via company.owner_id)
  job.updateJob
);
router.delete(
  "/jobs/:id",
  requireAuth,
  ensureJobOwner({ from: "params", field: "id" }),
  job.deleteJob
);
router.post(
  "/jobs/:id/duplicate",
  requireAuth,
  ensureJobOwner({ from: "params", field: "id" }),
  job.duplicateJob
);

router.post("/jobs/:id/bookmark", requireAuth, requireRole("candidate"), job.addBookmark);
router.delete("/jobs/:id/bookmark", requireAuth, requireRole("candidate"), job.removeBookmark);

/* ========== APPLICATIONS ========== */
router.post("/jobs/:id/apply", requireAuth, requireRole("candidate"), application.applyToJob);
router.get("/employer/applications", requireAuth, requireRole("employer", "admin"), application.listEmployerApplications);

router.get("/applications/:id", requireAuth, application.getApplicationById);
router.patch("/applications/:id", requireAuth, requireRole("employer", "admin"), application.updateApplicationStatus);
router.delete("/applications/:id", requireAuth, requireRole("candidate", "admin"), application.deleteApplication);

/* ========== TAGS/SEARCH ========== */
router.get("/tags", tag.listTags);
router.get("/tags/popular", tag.popularTags);
router.get("/search/jobs", job.searchJobs);

/* ========== FEEDS ========== */
router.get("/rss/jobs.xml", feed.rssJobs);

/* ========== ADMIN ========== */
router.get("/admin/jobs", requireAuth, requireRole("admin"), admin.listJobs);
router.post("/admin/jobs/:id/approve", requireAuth, requireRole("admin"), admin.approveJob);
router.post("/admin/jobs/:id/reject", requireAuth, requireRole("admin"), admin.rejectJob);
router.get("/admin/users", requireAuth, requireRole("admin"), admin.listUsers);
router.get("/admin/companies", requireAuth, requireRole("admin"), admin.listCompanies);
router.patch("/admin/users/:id/role", requireAuth, requireRole("admin"), admin.updateUserRole);

export default router;
