const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('Falta MONGO_URI en el archivo .env');
    }

    // Conexión a Mongo
    await mongoose.connect(uri);

    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Error conectando MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
