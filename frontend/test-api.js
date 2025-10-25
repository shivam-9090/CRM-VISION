// Quick test script to verify API connection
const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test base endpoint
    const response1 = await fetch('http://localhost:3001/api');
    const text1 = await response1.text();
    console.log('Base API response:', text1);
    
    // Test register endpoint
    const response2 = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123',
        name: 'Test User'
      })
    });
    
    const data2 = await response2.json();
    console.log('Register response:', data2);
    
  } catch (error) {
    console.error('API test error:', error);
  }
};

testAPI();