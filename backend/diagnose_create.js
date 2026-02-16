const axios = require('axios');

async function testCreate() {
  const email = `test_${Date.now()}@example.com`;
  try {
    // 1. Register
    console.log('Registering...');
    await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Tester',
      email: email,
      password: 'password123'
    });

    // 2. Login
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      password: 'password123'
    });
    
    const token = loginRes.data.token;

    // 3. Attempt Create with relaxed constraints
    console.log('Attempting ticket creation (3 char title)...');
    const ticketRes = await axios.post('http://localhost:5000/api/tickets', {
      title: 'Fix', // 3 chars - now allowed
      description: 'The bug', // 7 chars - now allowed
      category: 'General',
      priority: 'Medium'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Response Success:', ticketRes.data.message);
  } catch (err) {
    if (err.response) {
      console.log('Error Status:', err.response.status);
      console.log('Error Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error:', err.message);
    }
  }
}

testCreate();
