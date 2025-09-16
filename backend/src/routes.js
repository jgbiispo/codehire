import express from "express";
import Register from "./controllers/auth_controller/register.controller.js";
const router = express.Router();

// Auth routes
router.post("/register", Register);
router.post("/login", (req, res) => { });
router.post("/logout", (req, res) => { });
router.post("/refresh", (req, res) => { });

// User routes
router.get("/me", (req, res) => { });
router.patch("/me", (req, res) => { });
router.get("/me/bookmarks", (req, res) => { });
router.post("/me/applications", (req, res) => { });

// Enterprise routes
router.get("/companies", (req, res) => { });
router.get("/companies/:slug", (req, res) => { });
router.patch("/companies/:id", (req, res) => { });
router.post("/companies/:id/verify", (req, res) => { });

// Uploads routes
router.post("/uploads/presign", (req, res) => { });

// Jobs routes
router.post("/jobs", (req, res) => { });
router.get("/jobs", (req, res) => { });
router.get("/jobs/:slug", (req, res) => { });
router.patch("/jobs/:id", (req, res) => { });
router.delete("/jobs/:id", (req, res) => { });
router.post("/jobs/:id/duplicate", (req, res) => { });
router.post("/jobs/:id/bookmark", (req, res) => { });
router.delete("/jobs/:id/bookmark", (req, res) => { });

// Applications routes
router.post("/jobs/:id/apply", (req, res) => { });
router.get("/employer/applications", (req, res) => { });
router.patch("/applications/:id", (req, res) => { });

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