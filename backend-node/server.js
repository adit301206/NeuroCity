const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints'); // Import new route module

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount Routing Paths
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes); // Register complaints path here!

app.get('/', (req, res) => {
    res.json({ status: "online", service: "NeuroCity Core Gateway Router" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[System Online] NeuroCity Gateway running on port ${PORT}`));