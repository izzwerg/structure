const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');

async function seed() {
  const [,, login, password, name] = process.argv;

  if (!login || !password) {
    console.log('Використання: node src/utils/seedUser.js <login> <password> [name]');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const existingUser = await User.findOne({ login: login.toLowerCase() });
    if (existingUser) {
      console.log(`Користувач з логіном "${login}" вже існує.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      login: login.toLowerCase(),
      passwordHash,
      name: name || login,
    });

    console.log(`Користувача "${login}" успішно створено!`);
  } catch (err) {
    console.error('Помилка при створенні:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();