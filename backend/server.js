require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://palaniandavarmotors.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/vehicles', require('./routes/vehicleStockRoutes'));
app.use('/api/spares', require('./routes/spareRoutes'));
app.use('/api', require('./routes/dashboardRoutes'));

app.get('/', (req, res) => res.send('EV Showroom API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
