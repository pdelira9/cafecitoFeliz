const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes')
const productRoutes = require('./src/routes/productRoutes');
const customersRoutes = require('./src/routes/customersRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const usersRoutes = require('./src/routes/usersRoutes');

const { errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

const origin = process.env.FRONT_APP_URL || "http://localhost:4200";
console.log("CORS ORIGIN:", origin);
app.use(
  cors({
    origin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Cafecito Feliz API is running' });
});

app.use(errorHandler);

module.exports = { app };
