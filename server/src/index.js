// server/src/index.js
const express = require('express');
const app = express();

// ... налаштування middleware, cors, routes ...

const PORT = process.env.PORT || 5000;
// '0.0.0.0' дозволяє приймати запити з локальної мережі
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});