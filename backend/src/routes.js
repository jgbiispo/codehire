import express from "express";
import { auth, user, company, application, job, feed, tag, admin } from "./controllers/index.js";
import { dbHealth } from "../db/sequelize.js";
import { requireAuth, optionalAuth } from "./middlewares/auth.js";

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
router.post("/register", auth.register);
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
router.post("/companies", requireAuth, company.createCompany);
router.patch("/companies/:id", requireAuth, company.updateCompany);
router.post("/companies/:id/verify", requireAuth, company.verifyCompany);

/* ========== UPLOADS S3 ========== */
router.post("/uploads/presign", requireAuth, (req, res) => { /* TODO */ });

/* ========== JOBS ========== */
router.post("/jobs", requireAuth, job.createJob);
router.get("/jobs", optionalAuth, job.listJobs);
router.get("/jobs/:slug", optionalAuth, job.getJobBySlug);
router.patch("/jobs/:id", requireAuth, job.updateJob);
router.delete("/jobs/:id", requireAuth, job.deleteJob);
router.post("/jobs/:id/duplicate", requireAuth, job.duplicateJob);
router.post("/jobs/:id/bookmark", requireAuth, job.addBookmark);
router.delete("/jobs/:id/bookmark", requireAuth, job.removeBookmark);

/* ========== APPLICATIONS ========== */
router.post("/jobs/:id/apply", requireAuth, application.applyToJob);
router.get("/employer/applications", requireAuth, application.listEmployerApplications);
router.get("/applications/:id", requireAuth, application.getApplicationById);
router.patch("/applications/:id", requireAuth, application.updateApplicationStatus);
router.delete("/applications/:id", requireAuth, application.deleteApplication);

/* ========== TAGS/SEARCH ========== */
router.get("/tags", tag.listTags);
router.get("/tags/popular", tag.popularTags);
router.get("/search/jobs", job.searchJobs);

/* ========== FEEDS ========== */
router.get("/rss/jobs.xml", feed.rssJobs);

/* ========== ADMIN ========== */
router.get("/admin/jobs", requireAuth, admin.listJobs);
router.post("/admin/jobs/:id/approve", requireAuth, admin.approveJob);
router.post("/admin/jobs/:id/reject", requireAuth, admin.rejectJob);
router.get("/admin/users", requireAuth, admin.listUsers);
router.get("/admin/companies", requireAuth, admin.listCompanies);

export default router;
