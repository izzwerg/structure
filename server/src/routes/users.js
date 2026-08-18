const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Middleware доступу тільки для адміністратора
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Доступ дозволено тільки адміністраторам' });
};

// GET /api/users — Список усіх користувачів
router.get('/', adminOnly, async (req, res) => {
    try {
        const users = await User.find({}, '-passwordHash').sort({ name: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users — Створення нового користувача
router.post('/', adminOnly, async (req, res) => {
    try {
        const { login, password, name, role } = req.body;

        if (!login || !password || !name) {
            return res.status(400).json({ message: "Логін, ім'я та пароль є обовʼязковими" });
        }

        const normalizedLogin = login.trim().toLowerCase();
        const existingUser = await User.findOne({ login: normalizedLogin });
        if (existingUser) {
            return res.status(400).json({ message: 'Користувач із таким логіном вже існує' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({
            login: normalizedLogin,
            passwordHash,
            name: name.trim(),
            role: role || 'editor',
        });

        await user.save();
        res.status(201).json({ _id: user._id, login: user.login, name: user.name, role: user.role });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/users/:id/role — Зміна ролі
router.put('/:id/role', adminOnly, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { returnDocument: 'after', select: '-passwordHash' }
        );
        if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/users/:id — Видалення користувача
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'Неможливо видалити власного користувача' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
        res.json({ message: 'Користувача видалено' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;