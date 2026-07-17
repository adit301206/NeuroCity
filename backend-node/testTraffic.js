const axios = require('axios');
const FormData = require('form-data');

const baseUrl = 'http://localhost:5000/api';

const runTrafficTest = async () => {
    console.log('--- Starting Traffic Analysis Endpoint Verification ---');

    try {
        // 1. Log in to get a valid JWT token
        console.log('[Test] Logging in as admin...');
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: 'admin@neurocity.gov',
            password: 'AdminPassword123!'
        });
        
        const token = loginRes.data.token;
        console.log('[Test] Login successful. Token obtained.');

        // 2. Prepare multipart form data with a dummy image buffer
        const form = new FormData();
        const dummyBuffer = Buffer.from('fake-image-bytes-here');
        form.append('traffic_image', dummyBuffer, {
            filename: 'traffic_test.jpg',
            contentType: 'image/jpeg'
        });
        form.append('cameraLocation', 'Main St & Broadway Intersection');

        // 3. Post to /api/traffic/analyze
        console.log('[Test] Sending traffic analysis request...');
        const response = await axios.post(`${baseUrl}/traffic/analyze`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('PASS: Telemetry saved successfully:', response.data);
    } catch (err) {
        if (err.response) {
            const data = err.response.data;
            if (data.status === 'error' && data.message.includes('ValidationError')) {
                console.error('FAIL: Mongoose ValidationError encountered:', data);
            } else if (err.response.status === 502) {
                console.log('PASS: Correctly bypassed Mongoose validation! Failed gracefully at Django Microservice connection:', data);
            } else {
                console.error('FAIL: Request failed with unexpected status/data:', err.response.status, data);
            }
        } else {
            console.error('FAIL: Network or other error:', err.message);
        }
    }

    console.log('--- Traffic Analysis Endpoint Verification Complete ---');
};

runTrafficTest();
