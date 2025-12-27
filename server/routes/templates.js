import express from 'express';
import Template from '../models/Template.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all templates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, subject, htmlBody } = req.body;

    if (!name || !subject || !htmlBody) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const template = new Template({ name, subject, htmlBody });
    await template.save();

    res.status(201).json({ message: 'Template created', template });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Template name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, subject, htmlBody } = req.body;

    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { name, subject, htmlBody },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template updated', template });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Template name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
