import express from 'express';
import { pool } from '../db.js'; // Imports directly from db.js instead of index.js

const router = express.Router();

// 1. GET ALL HABITS
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT h.*, 
        COALESCE(
          json_agg(hl.completed_at::text) FILTER (WHERE hl.completed_at IS NOT NULL), 
          '[]'
        ) AS completed_dates
      FROM habits h
      LEFT JOIN habit_logs hl ON h.id = hl.habit_id
      GROUP BY h.id
      ORDER BY h.id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching habits:', error.message);
    res.status(500).json({ error: 'Server error fetching habits' });
  }
});

// 2. CREATE A NEW HABIT (With Category Support)
router.post('/', async (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const chosenCategory = category || 'General';

  try {
    const result = await pool.query(
      'INSERT INTO habits (name, category, streak, is_completed) VALUES ($1, $2, 0, false) RETURNING *',
      [name, chosenCategory]
    );
    
    const newHabit = { ...result.rows[0], completed_dates: [] };
    res.status(201).json(newHabit);
  } catch (error) {
    console.error('Error creating habit:', error.message);
    res.status(500).json({ error: 'Server error creating habit' });
  }
});

// 3. TOGGLE COMPLETED STATE
router.post('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    const logCheck = await pool.query(
      'SELECT 1 FROM habit_logs WHERE habit_id = $1 AND completed_at = $2',
      [id, today]
    );

    const logExists = logCheck.rows.length > 0;

    if (logExists) {
      await pool.query(
        'DELETE FROM habit_logs WHERE habit_id = $1 AND completed_at = $2',
        [id, today]
      );
      
      await pool.query(
        'UPDATE habits SET is_completed = false, streak = GREATEST(0, streak - 1) WHERE id = $1',
        [id]
      );
    } else {
      await pool.query(
        'INSERT INTO habit_logs (habit_id, completed_at) VALUES ($1, $2)',
        [id, today]
      );
      
      await pool.query(
        'UPDATE habits SET is_completed = true, streak = streak + 1 WHERE id = $1',
        [id]
      );
    }

    const updatedQuery = `
      SELECT h.*, 
        COALESCE(
          json_agg(hl.completed_at::text) FILTER (WHERE hl.completed_at IS NOT NULL), 
          '[]'
        ) AS completed_dates
      FROM habits h
      LEFT JOIN habit_logs hl ON h.id = hl.habit_id
      WHERE h.id = $1
      GROUP BY h.id;
    `;
    const finalResult = await pool.query(updatedQuery, [id]);
    res.json(finalResult.rows[0]);

  } catch (error) {
    console.error('Error toggling habit:', error.message);
    res.status(500).json({ error: 'Server error toggling habit' });
  }
});

// 4. DELETE A HABIT
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM habits WHERE id = $1', [id]);
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Error deleting habit:', error.message);
    res.status(500).json({ error: 'Server error deleting habit' });
  }
});

export default router;