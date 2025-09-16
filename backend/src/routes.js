import express from "express";
import {
  authControllers,
  userControllers,
  companyControllers,
  applicationControllers,
  jobControllers,
} from "./controllers/index.js";
import { dbHealth, initAssociations } from "../db/sequelize.js";
import { requireAuth } from "./middlewares/auth.js";

const router = express.Router();
initAssociations();

// Health check
router.get("/health", async (req, res) => {
  try {
    await dbHealth();
    res.status(200).json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

// Auth routes
router.post("/register", authControllers().register);
router.post("/login", authControllers().login);
router.post("/refresh", authControllers().refresh);
router.post("/logout", authControllers().logout);

// User routes
router.get("/me", requireAuth, userControllers().getMe);
router.patch("/me", requireAuth, userControllers().patchMe);
router.get("/me/bookmarks", requireAuth, userControllers().list_bookmarks);
router.get("/me/applications", requireAuth, userControllers().list_my_applications);

// Enterprise routes
router.get("/companies", companyControllers().listCompanies);
router.get("/companies/:slug", companyControllers().getCompanyBySlug);
router.post("/companies", requireAuth, companyControllers().createCompany);
router.patch("/companies/:id", requireAuth, companyControllers().updateCompany);
router.post("/companies/:id/verify", requireAuth, companyControllers().verifyCompany);

// Uploads routes
router.post("/uploads/presign", (req, res) => { });

// Jobs routes
router.post("/jobs", requireAuth, jobControllers().createJob);
router.get("/jobs", (req, res) => { });
router.get("/jobs/:slug", (req, res) => { });
router.patch("/jobs/:id", (req, res) => { });
router.delete("/jobs/:id", (req, res) => { });
router.post("/jobs/:id/duplicate", (req, res) => { });
router.post("/jobs/:id/bookmark", (req, res) => { });
router.delete("/jobs/:id/bookmark", (req, res) => { });

// Applications routes
router.post("/jobs/:id/apply", requireAuth, applicationControllers().applyToJob);
router.get("/employer/applications", requireAuth, applicationControllers().listEmployerApplications);
router.get("/applications/:id", requireAuth, applicationControllers().getApplicationById);
router.patch("/applications/:id", requireAuth, applicationControllers().updateApplicationStatus);
router.delete("/applications/:id", requireAuth, applicationControllers().deleteApplication);

// Tags routes
router.get("/tags", (req, res) => { });
router.get("/tags/popular", (req, res) => { });
router.get("/search/jobs", (req, res) => { });

// Feed routes
router.get("/rss/jobs.xml", (req, res) => { });
router.get("/sitemap.xml", (req, res) => { });
router.get("/health", (req, res) => { });

// Admin routes
router.get("/admin/jobs", (req, res) => { });
router.post("/admin/jobs/:id/approve", (req, res) => { });
router.post("/admin/jobs/:id/reject", (req, res) => { });
router.get("/admin/users", (req, res) => { });
router.get("/admin/companies", (req, res) => { });

export default router;