import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to read JSON data sent in request bodies

// Simple test route
app.get('/', (req, res) => {
  res.send('Habit Tracker API is running smoothly! 🚀');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});