import 'dotenv/config';
import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
import routes from './routes.js';
import { sequelize, initAssociations } from "../db/sequelize.js";
import { applyHttpHardening } from './server/security.js';
import { applyRateLimiting } from './server/rate-limit.js';
import { attachRequestId } from './server/error.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
applyHttpHardening(app);  // Helmet, HPP, etc.
applyRateLimiting(app);   // Rate limiting
app.use(attachRequestId); // Request ID

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Rotas
app.use('/api', routes);

// Test DB connection
(async () => {
  try {
    await sequelize.authenticate();
    initAssociations();
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});