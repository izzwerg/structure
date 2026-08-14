const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Отримати всі категорії, відсортовані за `order`
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1, name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Помилка завантаження категорій' });
    }
});

// Створити категорію
router.post('/', async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Категорія з такою назвою вже існує' });
        }
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/categories/reorder — оновлення порядку категорій
router.put('/reorder', async (req, res) => {
    try {
        const { orderedCategories } = req.body; // Масив об'єктів [{ _id, order }, ...]

        if (!Array.isArray(orderedCategories)) {
            return res.status(400).json({ message: 'Невалідний формат даних' });
        }

        const bulkOps = orderedCategories.map((cat, index) => ({
            updateOne: {
                filter: { _id: cat._id },
                update: { order: index },
            },
        }));

        await Category.bulkWrite(bulkOps);
        res.json({ message: 'Порядок категорій успішно оновлено' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Оновити категорію
router.put('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after' }
        );
        res.json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Видалити категорію
router.delete('/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Категорію видалено' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;