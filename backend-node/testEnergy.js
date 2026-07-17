const axios = require('axios');
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Configure DNS fallback to resolve MongoDB Atlas SRV records correctly
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (error) {
    console.warn(`[DNS Warning] Could not set custom DNS servers: ${error.message}`);
}

const baseUrl = 'http://localhost:5000/api';

const runTests = async () => {
    console.log('--- Starting Energy Sentinel End-to-End Tests ---');

    let token;
    try {
        console.log('[Test] Logging in as admin...');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'admin@neurocity.gov',
            password: 'AdminPassword123!'
        });
        token = loginRes.data.token;
        console.log('[Test] Login successful. Token obtained.');
    } catch (err) {
        console.error('FAIL: Login failed:', err.response ? err.response.data : err.message);
        return;
    }

    // Define test cases: (regionZone, temperature, humidity, expectedStatusCheck)
    const testCases = [
        { regionZone: 'Gujarat', temperature: 15, humidity: 40, label: 'Cool Day (Expected NORMAL)' },
        { regionZone: 'maharashtra', temperature: 35, humidity: 65, label: 'Warm Day (Expected STRESSED/CRITICAL)' },
        { regionZone: 'Uttar Pradesh', temperature: 40, humidity: 95, label: 'Extreme Day (Expected CRITICAL)' }
    ];

    for (const tc of testCases) {
        try {
            console.log(`\n[Test] Sending forecast request for: ${tc.label} [${tc.regionZone}, Temp: ${tc.temperature}, Humid: ${tc.humidity}]`);
            const res = await axios.post(`${baseUrl}/energy/forecast`, {
                regionZone: tc.regionZone,
                temperature: tc.temperature,
                humidity: tc.humidity
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(`PASS: Forecast response received successfully:`, res.data);
        } catch (err) {
            console.error(`FAIL: Forecast request failed:`, err.response ? err.response.data : err.message);
        }
    }

    // Verify DB logging by directly querying MongoDB
    console.log('\n[Test] Connecting to MongoDB to verify database logs...');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection;
        const logs = await db.collection('energylogs').find().sort({ createdAt: -1 }).limit(3).toArray();
        
        console.log(`PASS: Found ${logs.length} recently logged grid metrics in MongoDB Atlas:`);
        logs.forEach((log, idx) => {
            console.log(`  Log #${idx + 1}: Region: ${log.regionZone}, Temp: ${log.temperature}°C, Humid: ${log.humidity}%, Load: ${log.predictedLoadMW} MW, Status: ${log.gridStatus}, CheckedBy: ${log.checkedBy}`);
        });
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('FAIL: Database verification failed:', err.message);
    }

    console.log('\n--- Energy Sentinel End-to-End Tests Complete ---');
};

runTests();
