require('dotenv').config();
const { app } = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(` ✅ API escuchando en http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("❌ Error iniciando el servidor", err);
  process.exit(1);
});
