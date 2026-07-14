import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js'; // Pointing to the new adjacent db file
import habitsRouter from './routes/habits.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/habits', habitsRouter);

app.get('/', (req, res) => {
  res.send('Habit Tracker SQL API is running smoothly! 🚀');
});

// Verify connection using the centralized pool
pool.connect()
  .then((client) => {
    console.log('Successfully connected to Cloud PostgreSQL! 🐘');
    client.release();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed. Details:', error.message);
  });