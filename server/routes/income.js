import express from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all income with filtering and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      category, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = supabase
      .from('income')
      .select('*', { count: 'exact' });

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Date range filter
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      income: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// Get income statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('income')
      .select('category, amount, date');

    // Date range filter
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const totalIncome = data.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
    
    const byCategory = data.reduce((acc, inc) => {
      if (!acc[inc.category]) {
        acc[inc.category] = 0;
      }
      acc[inc.category] += parseFloat(inc.amount);
      return acc;
    }, {});

    const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      percentage: ((amount / totalIncome) * 100).toFixed(2)
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      incomeCount: data.length,
      categoryBreakdown,
      dateRange: {
        start: startDate || null,
        end: endDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching income stats:', error);
    res.status(500).json({ error: 'Failed to fetch income statistics' });
  }
});

// Get a single income by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// Create a new income
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      category,
      description,
      amount,
      date,
      payment_method,
      source_name,
      reference_number,
      notes
    } = req.body;

    // Validation
    if (!category || !description || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: category, description, and amount are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const incomeData = {
      category,
      description,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      payment_method: payment_method || null,
      source_name: source_name || null,
      reference_number: reference_number || null,
      notes: notes || null,
      created_by: req.adminEmail
    };

    const { data, error } = await supabase
      .from('income')
      .insert([incomeData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Income record created successfully',
      income: data
    });
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to create income record' });
  }
});

// Update an income
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      description,
      amount,
      date,
      payment_method,
      source_name,
      reference_number,
      notes
    } = req.body;

    // Validation
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date !== undefined) updateData.date = date;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (source_name !== undefined) updateData.source_name = source_name;
    if (reference_number !== undefined) updateData.reference_number = reference_number;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('income')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json({
      message: 'Income record updated successfully',
      income: data
    });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income record' });
  }
});

// Delete an income
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('income')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json({ message: 'Income record deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income record' });
  }
});

export default router;
