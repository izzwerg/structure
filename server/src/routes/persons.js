const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Отримати список усіх людей
router.get('/', async (req, res) => {
    try {
        const persons = await Person.find().sort({ lastName: 1, firstName: 1 });
        res.json(persons);
    } catch (err) {
        res.status(500).json({ message: 'Помилка завантаження списку' });
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
        const person = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(person);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;