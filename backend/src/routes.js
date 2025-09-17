import express from "express";
import { auth, user, company, application, job } from "./controllers/index.js";
import { dbHealth } from "../db/sequelize.js";
import { requireAuth, optionalAuth } from "./middlewares/auth.js";

const router = express.Router();

// Health check (único)
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

/* ========== UPLOADS ========== */
router.post("/uploads/presign", requireAuth, (req, res) => { /* TODO */ });

/* ========== JOBS ========== */
router.post("/jobs", requireAuth, job.createJob);
router.get("/jobs", optionalAuth, job.listJobs);
router.get("/jobs/:slug", optionalAuth, job.getJobBySlug);
router.patch("/jobs/:id", requireAuth, job.updateJob);
router.delete("/jobs/:id", requireAuth, job.deleteJob);
router.post("/jobs/:id/duplicate", requireAuth, job.duplicateJob);
router.post("/jobs/:id/bookmark", requireAuth, (req, res) => { /* TODO */ });
router.delete("/jobs/:id/bookmark", requireAuth, (req, res) => { /* TODO */ });

/* ========== APPLICATIONS ========== */
router.post("/jobs/:id/apply", requireAuth, application.applyToJob);
router.get("/employer/applications", requireAuth, application.listEmployerApplications);
router.get("/applications/:id", requireAuth, application.getApplicationById);
router.patch("/applications/:id", requireAuth, application.updateApplicationStatus);
router.delete("/applications/:id", requireAuth, application.deleteApplication);

/* ========== TAGS/SEARCH ========== */
router.get("/tags", (req, res) => { /* TODO */ });
router.get("/tags/popular", (req, res) => { /* TODO */ });
router.get("/search/jobs", (req, res) => { /* TODO */ });

/* ========== FEEDS ========== */
router.get("/rss/jobs.xml", (req, res) => { /* TODO */ });
router.get("/sitemap.xml", (req, res) => { /* TODO */ });

/* ========== ADMIN ========== */
// ideal: router.use("/admin", requireAuth, requireAdmin)
router.get("/admin/jobs", requireAuth, (req, res) => { /* TODO */ });
router.post("/admin/jobs/:id/approve", requireAuth, (req, res) => { /* TODO */ });
router.post("/admin/jobs/:id/reject", requireAuth, (req, res) => { /* TODO */ });
router.get("/admin/users", requireAuth, (req, res) => { /* TODO */ });
router.get("/admin/companies", requireAuth, (req, res) => { /* TODO */ });

export default router;
