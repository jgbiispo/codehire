import 'dotenv/config';
import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
import routes from './routes.js';
import { sequelize, initAssociations } from "../db/sequelize.js";
import { applyHttpHardening } from './server/security.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Apply security middlewares
applyHttpHardening(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
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