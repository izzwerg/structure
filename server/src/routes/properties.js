const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Отримати всі active-властивості (посортовані за `order`)
router.get('/', async (req, res) => {
    try {
        const properties = await Property.find({ is_active: true }).sort({ order: 1, createdAt: 1 });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: 'Помилка завантаження властивостей' });
    }
});

// Створити нову властивість
router.post('/', async (req, res) => {
    try {
        const property = await Property.create(req.body);
        res.status(201).json(property);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Властивість з таким property_id вже існує' });
        }
        res.status(400).json({ message: err.message });
    }
});

// Оновити властивість
router.put('/:id', async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(property);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;