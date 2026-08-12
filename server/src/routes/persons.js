const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/persons — отримати список людей (з можливістю виводу архівних через query-параметр)
router.get('/', async (req, res) => {
    try {
        const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };

        const persons = await Person.aggregate([
            { $match: filter },
            {
                $addFields: {
                    // Якщо treeNodeId не 'none', перетворюємо рядок на число для коректного сортування
                    numericTreeNodeId: {
                        $cond: {
                            if: { $eq: ['$treeNodeId', 'none'] },
                            then: Number.MAX_SAFE_INTEGER, // 'none' відправляємо в кінець
                            else: { $toInt: '$treeNodeId' } // Числові значення перетворюємо на Number
                        }
                    }
                }
            },
            // Сортуємо: спочатку за числовим ID, потім за прізвищем та ім'ям
            { $sort: { numericTreeNodeId: 1, lastName: 1, firstName: 1 } },
            // Прибираємо тимчасове розрахункове поле перед відправкою
            { $project: { numericTreeNodeId: 0 } }
        ]);

        res.json(persons);
    } catch (err) {
        res.status(500).json({ message: 'Помилка завантаження списку' });
    }
});

// GET /api/persons/archived — отримати заархівовані картки
router.get('/archived', async (req, res) => {
    try {
        const persons = await Person.aggregate([
            { $match: { isActive: false } },
            {
                $addFields: {
                    numericTreeNodeId: {
                        $cond: {
                            if: { $eq: ['$treeNodeId', 'none'] },
                            then: Number.MAX_SAFE_INTEGER,
                            else: { $toInt: '$treeNodeId' }
                        }
                    }
                }
            },
            { $sort: { numericTreeNodeId: 1, lastName: 1, firstName: 1 } },
            { $project: { numericTreeNodeId: 0 } }
        ]);

        res.json(persons);
    } catch (err) {
        res.status(500).json({ message: 'Помилка завантаження архіву' });
    }
});

// Отримати конкретну картку
router.get('/:id', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) return res.status(404).json({ message: 'Картку не знайдено' });
        res.json(person);
    } catch (err) {
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// Створити картку людини
router.post('/', async (req, res) => {
    try {
        const person = await Person.create(req.body);
        res.status(201).json(person);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Оновити картку
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Якщо картку деактивують, автоматично скидаємо treeNodeId
        if (updateData.isActive === false) {
            updateData.treeNodeId = 'none';
        }

        const person = await Person.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after' }
        );

        if (!person) {
            return res.status(404).json({ message: 'Картку не знайдено' });
        }

        res.json(person);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/persons/:id — м'яке видалення (isActive: false)
router.delete('/:id', async (req, res) => {
    try {
        const person = await Person.findByIdAndUpdate(
            req.params.id,
            {
                isActive: false,
                treeNodeId: 'none' // Автоматично скидаємо прив'язку до дерева
            },
            { returnDocument: 'after' }
        );

        if (!person) {
            return res.status(404).json({ message: 'Картку не знайдено' });
        }

        res.json({ message: 'Картку перенесено в архів', person });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/persons/:id/restore — відновити картку (isActive: true)
router.patch('/:id/restore', async (req, res) => {
    try {
        const person = await Person.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { returnDocument: 'after' }
        );

        if (!person) {
            return res.status(404).json({ message: 'Картку не знайдено' });
        }

        res.json({ message: 'Картку відновлено', person });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;