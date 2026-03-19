require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const cloudinary = require('./config/cloudinary');
const connectDB = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const petitionRoutes = require('./routes/petitions');
const volunteerRoutes = require('./routes/volunteers');
const complaintRoutes = require('./routes/complaintRoutes');
const pollsRoutes = require('./routes/polls');
const reportsRoutes = require('./routes/reports');

// Middleware
const { protect } = require('./middleware/auth');

const app = express();


// ======================
// ✅ Connect Database
// ======================
connectDB();


// ======================
// ✅ Cloudinary Test
// ======================
(async () => {
  try {
    const res = await cloudinary.api.ping();
    console.log('Cloudinary Connected:', res.status);
  } catch (err) {
    console.error('Cloudinary connection failed:', err.message);
  }
})();


// ======================
// ✅ CORS Setup
// ======================
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));


// ======================
// ✅ Body Parsers
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ======================
// ✅ PUBLIC ROUTES (NO AUTH)
// ======================
app.use('/api/auth', authRoutes);


// ======================
// ✅ PROTECTED ROUTES (JWT REQUIRED)
// ======================
app.use('/api/petitions', protect, petitionRoutes);
app.use('/api/volunteers', protect, volunteerRoutes);
app.use('/api/complaints', protect, complaintRoutes);
app.use('/api/polls', protect, pollsRoutes);
app.use('/api/reports', protect, reportsRoutes);


// ======================
// ✅ HEALTH CHECK
// ======================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    authentication: 'JWT + bcrypt secured'
  });
});


// ======================
// ✅ BCRYPT TEST
// ======================
app.get('/api/test-bcrypt', async (req, res) => {
  try {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    const isMatch = await bcrypt.compare(password, hash);

    res.json({
      bcryptTest: 'Successful',
      correctPasswordMatch: isMatch
    });
  } catch (error) {
    res.status(500).json({ error: 'bcrypt test failed' });
  }
});


// ======================
// ❌ 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


// ======================
// ❌ ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});


// ======================
// ✅ SERVER START
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  await mongoose.connection.asPromise();
  console.log(
    `📦 Database: ${
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    }`
  );
});