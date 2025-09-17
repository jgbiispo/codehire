import 'dotenv/config';
import express from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
import routes from './routes.js';
import { sequelize, initAssociations } from "../db/sequelize.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/', routes);

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