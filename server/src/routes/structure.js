const express = require('express');
const router = express.Router();
const Subdivision = require('../models/Subdivision');
const Position = require('../models/Position');
const Person = require('../models/Person');
const RootStructure = require('../models/RootStructure');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

async function getOrCreateRoot() {
    let root = await RootStructure.findOne();
    if (!root) {
        root = await RootStructure.create({ items: [] });
    }
    return root;
}

// 1. Отримати всю структуру
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

// Допоміжна функція вставки елемента в заданий індекс масиву items
function insertIntoItems(items, newItem, insertIndex) {
    if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= items.length) {
        items.splice(insertIndex + 1, 0, newItem);
    } else {
        items.push(newItem);
    }
}

// 2. Створити підрозділ (+s) з підтримкою insertIndex
router.post('/subdivision', async (req, res) => {
    try {
        const { title, fullTitle, shortTitle, parentId, insertIndex } = req.body;

        const subdivision = await Subdivision.create({
            title,
            fullTitle,
            shortTitle,
            parentId: parentId || null,
            items: [],
        });

        const newItem = { kind: 'subdivision', itemId: subdivision._id };

        if (parentId) {
            const parentSub = await Subdivision.findById(parentId);
            if (parentSub) {
                insertIntoItems(parentSub.items, newItem, insertIndex);
                await parentSub.save();
            }
        } else {
            const root = await getOrCreateRoot();
            insertIntoItems(root.items, newItem, insertIndex);
            await root.save();
        }

        res.status(201).json(subdivision);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. Створити посаду (+p) з підтримкою insertIndex
router.post('/position', async (req, res) => {
    try {
        const { treeNodeId, shortTitle, fullTitle, rank, specialtyCode, tariff, parentId, insertIndex } = req.body;

        const existingPos = await Position.findOne({ treeNodeId });
        if (existingPos) {
            return res.status(400).json({ message: `Посада з ID "${treeNodeId}" вже існує` });
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

        const newItem = { kind: 'position', itemId: position._id };

        if (parentId) {
            const parentSub = await Subdivision.findById(parentId);
            if (parentSub) {
                insertIntoItems(parentSub.items, newItem, insertIndex);
                await parentSub.save();
            }
        } else {
            const root = await getOrCreateRoot();
            insertIntoItems(root.items, newItem, insertIndex);
            await root.save();
        }

        res.status(201).json(position);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. Призначити/зняти особу з посади
router.post('/assign-person', async (req, res) => {
    try {
        const { personId, treeNodeId, vosByPos } = req.body;

        let positionTitle = '';

        if (treeNodeId && treeNodeId !== '') {
            const position = await Position.findOne({ treeNodeId });
            if (position) {
                positionTitle = position.fullTitle || position.shortTitle;
            }
        }

        const person = await Person.findByIdAndUpdate(
            personId,
            {
                treeNodeId: treeNodeId || '',
                position: positionTitle,
                vosByPos: vosByPos || ''
            },
            { returnDocument: 'after' }
        );

        res.json(person);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 5. Видалити посаду
router.delete('/position/:id', async (req, res) => {
    try {
        const posId = req.params.id;
        const position = await Position.findById(posId);
        if (!position) return res.status(404).json({ message: 'Посаду не знайдено' });

        // Очищаємо Tree Node ID у прив'язаної людини (скидаємо на '')
        await Person.updateMany({ treeNodeId: position.treeNodeId }, { treeNodeId: '', position: '', vosByPos: '' });

        // Видаляємо посилання з батьківського підрозділу чи кореня
        await Subdivision.updateMany({}, { $pull: { items: { itemId: posId } } });
        await RootStructure.updateMany({}, { $pull: { items: { itemId: posId } } });

        // Видаляємо саму посаду
        await Position.findByIdAndDelete(posId);

        res.json({ message: 'Посаду видалено' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Рекурсивна функція для збору всіх дочірніх посад та підрозділів
async function collectNestedIds(subdivisionId) {
    let subIds = [subdivisionId];
    let posIds = [];
    let treeNodeIdsToReset = [];

    const sub = await Subdivision.findById(subdivisionId).lean();
    if (!sub) return { subIds, posIds, treeNodeIdsToReset };

    for (const item of sub.items) {
        if (item.kind === 'position') {
            posIds.push(item.itemId);
            const pos = await Position.findById(item.itemId).lean();
            if (pos) treeNodeIdsToReset.push(pos.treeNodeId);
        } else if (item.kind === 'subdivision') {
            const nested = await collectNestedIds(item.itemId);
            subIds.push(...nested.subIds);
            posIds.push(...nested.posIds);
            treeNodeIdsToReset.push(...nested.treeNodeIdsToReset);
        }
    }

    return { subIds, posIds, treeNodeIdsToReset };
}

// 6. Видалити підрозділ (каскадне видалення всього вмісту)
router.delete('/subdivision/:id', async (req, res) => {
    try {
        const targetSubId = req.params.id;

        // Збираємо всі підпідрозділи та посади
        const { subIds, posIds, treeNodeIdsToReset } = await collectNestedIds(targetSubId);

        // Скидаємо картки людей у ''
        if (treeNodeIdsToReset.length > 0) {
            await Person.updateMany(
                { treeNodeId: { $in: treeNodeIdsToReset } },
                { treeNodeId: '', position: '', vosByPos: '' }
            );
        }

        // Видаляємо всі посади
        if (posIds.length > 0) {
            await Position.deleteMany({ _id: { $in: posIds } });
        }

        // Видаляємо всі підрозділи
        await Subdivision.deleteMany({ _id: { $in: subIds } });

        // Видаляємо посилання на цей підрозділ із батьків
        await Subdivision.updateMany({}, { $pull: { items: { itemId: targetSubId } } });
        await RootStructure.updateMany({}, { $pull: { items: { itemId: targetSubId } } });

        res.json({ message: 'Підрозділ та весь його вміст успішно видалено' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/structure/subdivision/:id — редагування підрозділу
router.put('/subdivision/:id', async (req, res) => {
    try {
        const { title, fullTitle, shortTitle } = req.body;
        const subdivision = await Subdivision.findByIdAndUpdate(
            req.params.id,
            { title, fullTitle, shortTitle },
            { returnDocument: 'after' }
        );

        if (!subdivision) {
            return res.status(404).json({ message: 'Підрозділ не знайдено' });
        }

        res.json(subdivision);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/structure/position/:id — редагування посади
router.put('/position/:id', async (req, res) => {
    try {
        const { treeNodeId, shortTitle, fullTitle, rank, specialtyCode, tariff } = req.body;
        const oldPosition = await Position.findById(req.params.id);

        if (!oldPosition) {
            return res.status(404).json({ message: 'Посаду не знайдено' });
        }

        const newPositionTitle = fullTitle || shortTitle;

        // Перевіряємо унікальність Tree Node ID при його зміні
        if (treeNodeId !== oldPosition.treeNodeId) {
            const exists = await Position.findOne({ treeNodeId });
            if (exists) {
                return res.status(400).json({ message: `Посада з ID "${treeNodeId}" вже існує` });
            }
        }

        // Синхронно оновлюємо дані особи, якщо на посаді вже є призначена людина
        await Person.updateMany(
            { treeNodeId: oldPosition.treeNodeId },
            {
                treeNodeId: treeNodeId,
                position: newPositionTitle,
                vosByPos: specialtyCode || '' // Записуємо новий ВОС за посадою
            }
        );

        const position = await Position.findByIdAndUpdate(
            req.params.id,
            { treeNodeId, shortTitle, fullTitle, rank, specialtyCode, tariff },
            { returnDocument: 'after' }
        );

        res.json(position);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;