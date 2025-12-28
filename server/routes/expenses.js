import express from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all expenses with filtering and pagination
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
      .from('expenses')
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
      expenses: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('expenses')
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
    const totalExpenses = data.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    const byCategory = data.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += parseFloat(exp.amount);
      return acc;
    }, {});

    const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      percentage: ((amount / totalExpenses) * 100).toFixed(2)
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      expenseCount: data.length,
      categoryBreakdown,
      dateRange: {
        start: startDate || null,
        end: endDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({ error: 'Failed to fetch expense statistics' });
  }
});

// Get a single expense by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create a new expense
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      category,
      description,
      amount,
      date,
      payment_method,
      vendor_name,
      receipt_number,
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

    const expenseData = {
      category,
      description,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      payment_method: payment_method || null,
      vendor_name: vendor_name || null,
      receipt_number: receipt_number || null,
      notes: notes || null,
      created_by: req.adminEmail
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Expense created successfully',
      expense: data
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update an expense
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      description,
      amount,
      date,
      payment_method,
      vendor_name,
      receipt_number,
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
    if (vendor_name !== undefined) updateData.vendor_name = vendor_name;
    if (receipt_number !== undefined) updateData.receipt_number = receipt_number;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({
      message: 'Expense updated successfully',
      expense: data
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete an expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
