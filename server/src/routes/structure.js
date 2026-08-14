const express = require('express');
const router = express.Router();
const Subdivision = require('../models/Subdivision');
const Position = require('../models/Position');
const Person = require('../models/Person');
const RootStructure = require('../models/RootStructure');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Отримати або створити корінь структури
async function getOrCreateRoot() {
    let root = await RootStructure.findOne();
    if (!root) {
        root = await RootStructure.create({ items: [] });
    }
    return root;
}

// 1. Отримати всю структуру та прив'язаних людей
router.get('/', async (req, res) => {
    try {
        const root = await getOrCreateRoot();
        const subdivisions = await Subdivision.find().lean();
        const positions = await Position.find().lean();
        const persons = await Person.find({ isActive: true }).lean();

        res.json({
            rootItems: root.items,
            subdivisions,
            positions,
            persons,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Створити новий підрозділ (+s)
router.post('/subdivision', async (req, res) => {
    try {
        const { title, fullTitle, shortTitle, parentId } = req.body;

        const subdivision = await Subdivision.create({
            title,
            fullTitle,
            shortTitle,
            parentId: parentId || null,
            items: [],
        });

        if (parentId) {
            await Subdivision.findByIdAndUpdate(parentId, {
                $push: { items: { kind: 'subdivision', itemId: subdivision._id } },
            });
        } else {
            const root = await getOrCreateRoot();
            root.items.push({ kind: 'subdivision', itemId: subdivision._id });
            await root.save();
        }

        res.status(201).json(subdivision);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. Створити нову посаду (+p)
router.post('/position', async (req, res) => {
    try {
        const { treeNodeId, shortTitle, fullTitle, rank, specialtyCode, tariff, parentId } = req.body;

        const existingPos = await Position.findOne({ treeNodeId });
        if (existingPos) {
            return res.status(400).json({ message: `Посада з Tree Node ID "${treeNodeId}" вже існує` });
        }

        const position = await Position.create({
            treeNodeId,
            shortTitle,
            fullTitle,
            rank,
            specialtyCode,
            tariff,
            subdivisionId: parentId || null,
        });

        if (parentId) {
            await Subdivision.findByIdAndUpdate(parentId, {
                $push: { items: { kind: 'position', itemId: position._id } },
            });
        } else {
            const root = await getOrCreateRoot();
            root.items.push({ kind: 'position', itemId: position._id });
            await root.save();
        }

        res.status(201).json(position);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. Призначити людину на посаду (або зняти з посади)
router.post('/assign-person', async (req, res) => {
    try {
        const { personId, treeNodeId } = req.body;

        const person = await Person.findByIdAndUpdate(
            personId,
            { treeNodeId },
            { returnDocument: 'after' }
        );

        res.json(person);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;