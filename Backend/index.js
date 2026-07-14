import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up PostgreSQL Connection Pool using the connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for cloud hosting providers like Neon/Render
  }
});

// Simple test route
app.get('/', (req, res) => {
  res.send('Habit Tracker SQL API is running smoothly! 🚀');
});

// Test connection and start server
pool.connect()
  .then((client) => {
    console.log('Successfully connected to Cloud PostgreSQL! 🐘');
    client.release();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
  });

export { pool };