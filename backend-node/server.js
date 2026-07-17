const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints'); // Import new route module
const healthRoutes = require('./routes/health'); // Import health route module
const trafficRoutes = require('./routes/traffic'); // Import traffic route module
const energyRoutes = require('./routes/energy'); // Import energy sentinel route module

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount Routing Paths
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes); // Register complaints path here!
app.use('/api/health', healthRoutes); // Register master health check route
app.use('/api/traffic', trafficRoutes); // Register traffic pipeline route
app.use('/api/energy', energyRoutes); // Register energy sentinel pipeline route

app.get('/', (req, res) => {
    res.json({ status: "online", service: "NeuroCity Core Gateway Router" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[System Online] NeuroCity Gateway running on port ${PORT}`));