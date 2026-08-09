const express = require('express');
const cors = require('cors');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const globalHubRoutes = require('./routes/globalHub');
const complaintRoutes = require('./routes/complaints');
const healthRoutes = require('./routes/health');
const trafficRoutes = require('./routes/traffic');
const energyRoutes = require('./routes/energy');
const weatherRoutes = require('./routes/weather');
const statsRoutes = require('./routes/stats');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount Routing Paths
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hub', globalHubRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
    res.json({ status: "online", service: "NeuroCity Core Gateway Router" });
});

app.use('*', (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[System Online] NeuroCity Gateway running on port ${PORT}`));