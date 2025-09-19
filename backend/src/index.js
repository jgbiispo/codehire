import app from './app.js';
import { sequelize } from "../db/sequelize.js";

const PORT = process.env.CODEHIRE_API_PORT || 3000;

// Start server
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
  console.log(`Server is running on http://localhost:${PORT}`);
});
