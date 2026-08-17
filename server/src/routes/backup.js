const express = require('express');
const router = express.Router();
const multer = require('multer');

const Person = require('../models/Person');
const Property = require('../models/Property');
const Category = require('../models/Category');
const Subdivision = require('../models/Subdivision');
const Position = require('../models/Position');
const RootStructure = require('../models/RootStructure');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/backup/export — Експорт усіх даних у JSON-файл
router.get('/export', async (req, res) => {
    try {
        const [persons, properties, categories, subdivisions, positions, rootStructure] = await Promise.all([
            Person.find().lean(),
            Property.find().lean(),
            Category.find().lean(),
            Subdivision.find().lean(),
            Position.find().lean(),
            RootStructure.find().lean(),
        ]);

        const backupData = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            data: {
                persons,
                properties,
                categories,
                subdivisions,
                positions,
                rootStructure,
            },
        };

        const fileName = `backup_${new Date().toISOString().slice(0, 10)}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (err) {
        res.status(500).json({ message: 'Помилка експорту даних: ' + err.message });
    }
});

// POST /api/backup/restore — Повне відновлення даних із JSON-файлу
router.post('/restore', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Файл бекапу не надано' });
        }

        const backupContent = JSON.parse(req.file.buffer.toString('utf-8'));

        if (!backupContent.data) {
            return res.status(400).json({ message: 'Некоректна структура файлу бекапу' });
        }

        const { persons, properties, categories, subdivisions, positions, rootStructure } = backupContent.data;

        // 1. Повне очищення всіх існуючих колекцій
        await Promise.all([
            Person.deleteMany({}),
            Property.deleteMany({}),
            Category.deleteMany({}),
            Subdivision.deleteMany({}),
            Position.deleteMany({}),
            RootStructure.deleteMany({}),
        ]);

        // 2. Заповнення колекцій даними з бекапу
        if (persons?.length) await Person.insertMany(persons);
        if (properties?.length) await Property.insertMany(properties);
        if (categories?.length) await Category.insertMany(categories);
        if (subdivisions?.length) await Subdivision.insertMany(subdivisions);
        if (positions?.length) await Position.insertMany(positions);
        if (rootStructure?.length) await RootStructure.insertMany(rootStructure);

        res.json({ message: 'Базу даних успішно відновлено' });
    } catch (err) {
        res.status(500).json({ message: 'Помилка відновлення даних: ' + err.message });
    }
});

module.exports = router;