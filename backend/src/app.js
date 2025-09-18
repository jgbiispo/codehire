import 'dotenv/config';
import express from 'express';
import cookieParser from "cookie-parser";
import routes from './routes.js';
import { initAssociations } from "../db/sequelize.js";
import { applyHttpHardening } from './server/security.js';
import { applyRateLimiting } from './server/rate-limit.js';
import { attachRequestId } from './server/error.js';
import { errorHandler } from './server/error.js';

const app = express();
initAssociations();

// Security middlewares
applyHttpHardening(app);  // Helmet, HPP, etc.
applyRateLimiting(app);   // Rate limiting
app.use(attachRequestId); // Request ID

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Rotas
app.use('/', routes);
app.use(errorHandler);

export default app;
