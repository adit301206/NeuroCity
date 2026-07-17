const axios = require('axios');

const baseUrl = 'http://localhost:5000/api/auth';

const runTests = async () => {
    console.log('--- Starting Authentication Verification Tests ---');

    // 1. Missing field test
    try {
        await axios.post(`${baseUrl}/register`, {
            email: 'test@example.com',
            password: 'password123'
        });
        console.error('FAIL: Allowed registration with missing name');
    } catch (err) {
        console.log('PASS: Rejected registration with missing name:', err.response.data);
    }

    // 2. Password length test
    try {
        await axios.post(`${baseUrl}/register`, {
            name: 'Short Password User',
            email: 'short@example.com',
            password: '123'
        });
        console.error('FAIL: Allowed registration with short password');
    } catch (err) {
        console.log('PASS: Rejected registration with short password:', err.response.data);
    }

    // 3. Invalid role test
    try {
        await axios.post(`${baseUrl}/register`, {
            name: 'Bad Role User',
            email: 'badrole@example.com',
            password: 'password123',
            role: 'super_admin'
        });
        console.error('FAIL: Allowed registration with invalid role');
    } catch (err) {
        console.log('PASS: Rejected registration with invalid role:', err.response.data);
    }

    // 4. Duplicate email registration test (Case-insensitive check)
    try {
        await axios.post(`${baseUrl}/register`, {
            name: 'Duplicate Admin',
            email: 'ADMIN@neurocity.gov',
            password: 'AdminPassword123!',
            role: 'admin'
        });
        console.error('FAIL: Allowed registration with duplicate email');
    } catch (err) {
        console.log('PASS: Rejected registration with duplicate email:', err.response.data);
    }

    // 5. Successful registration test (Operator)
    try {
        const uniqueEmail = `operator_${Date.now()}@neurocity.gov`;
        const regRes = await axios.post(`${baseUrl}/register`, {
            name: 'Traffic Operator',
            email: uniqueEmail,
            password: 'OperatorPass123!',
            role: 'operator'
        });
        console.log('PASS: Successfully registered new operator:', regRes.data);

        // 6. Login as the newly created user
        const loginRes = await axios.post(`${baseUrl}/login`, {
            email: uniqueEmail,
            password: 'OperatorPass123!'
        });
        console.log('PASS: Successfully logged in as new operator:', loginRes.data);
        
        // 7. Verify case-insensitivity on login
        const caseInsensitiveLoginRes = await axios.post(`${baseUrl}/login`, {
            email: uniqueEmail.toUpperCase(),
            password: 'OperatorPass123!'
        });
        console.log('PASS: Case-insensitive login verified:', caseInsensitiveLoginRes.data.user.email);
        
    } catch (err) {
        console.error('FAIL: Registration or login failed:', err.response ? err.response.data : err.message);
    }

    console.log('--- Authentication Verification Tests Complete ---');
};

runTests();
