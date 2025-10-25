import api from './api';

export const testAllAPIs = async () => {
  console.log('🧪 Testing all API endpoints...');
  
  const results = {
    basicConnectivity: false,
    companies: false,
    contacts: false,
    deals: false,
    activities: false,
  };

  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    const healthCheck = await api.get('/');
    console.log('✅ Basic connectivity:', healthCheck.status);
    results.basicConnectivity = true;
  } catch (error) {
    console.error('❌ Basic connectivity failed:', error);
    return results;
  }

  // Test protected endpoints (these should return 401 without auth)
  const protectedEndpoints = [
    { name: 'companies', endpoint: '/companies' },
    { name: 'contacts', endpoint: '/contacts' },
    { name: 'deals', endpoint: '/deals' },
    { name: 'activities', endpoint: '/activities' },
  ];

  for (const { name, endpoint } of protectedEndpoints) {
    try {
      console.log(`2. Testing ${name} endpoint...`);
      await api.get(endpoint);
      console.log(`✅ ${name} endpoint accessible`);
      results[name as keyof typeof results] = true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number }; message?: string };
        if (axiosError.response?.status === 401) {
          console.log(`✅ ${name} endpoint exists (401 - needs auth)`);
          results[name as keyof typeof results] = true;
        } else {
          console.error(`❌ ${name} endpoint error:`, axiosError.response?.status, axiosError.message);
        }
      } else {
        console.error(`❌ ${name} endpoint error:`, error);
      }
    }
  }

  console.log('🧪 API Test Results:', results);
  return results;
};

export const testAuthFlow = async (testEmail = 'test@example.com', testPassword = '123456') => {
  console.log('🔐 Testing authentication flow...');
  
  try {
    // Try to register (might fail if user exists)
    console.log('1. Testing registration...');
    try {
      const registerResponse = await api.post('/auth/register', {
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      });
      console.log('✅ Registration successful:', registerResponse.status);
      return registerResponse.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 409) {
        console.log('ℹ️ User already exists, trying login...');
      } else {
        console.error('❌ Registration failed:', axiosError.response?.status, axiosError.response?.data);
        throw error;
      }
    }

    // Try login
    console.log('2. Testing login...');
    const loginResponse = await api.post('/auth/login', {
      email: testEmail,
      password: testPassword
    });
    console.log('✅ Login successful:', loginResponse.status);
    return loginResponse.data;
    
  } catch (error) {
    console.error('❌ Auth flow failed:', error);
    throw error;
  }
};

// Test authenticated endpoints after login
export const testAuthenticatedEndpoints = async (token: string) => {
  console.log('🔐 Testing authenticated endpoints...');
  
  // Set authorization header
  const originalAuth = api.defaults.headers.common['Authorization'];
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  const results = {
    companies: { list: false, create: false },
    contacts: { list: false, create: false },
    deals: { list: false, create: false },
    activities: { list: false, create: false }
  };
  
  try {
    // Test Companies
    console.log('📊 Testing Companies endpoints...');
    try {
      const companiesResponse = await api.get('/companies');
      console.log('✅ GET /companies:', companiesResponse.status);
      results.companies.list = true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error('❌ GET /companies failed:', axiosError.response?.status, axiosError.response?.data);
    }
    
    // Test Contacts
    console.log('👥 Testing Contacts endpoints...');
    try {
      const contactsResponse = await api.get('/contacts');
      console.log('✅ GET /contacts:', contactsResponse.status);
      results.contacts.list = true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error('❌ GET /contacts failed:', axiosError.response?.status, axiosError.response?.data);
    }
    
    // Test Deals
    console.log('💰 Testing Deals endpoints...');
    try {
      const dealsResponse = await api.get('/deals');
      console.log('✅ GET /deals:', dealsResponse.status);
      results.deals.list = true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error('❌ GET /deals failed:', axiosError.response?.status, axiosError.response?.data);
    }
    
    // Test Activities
    console.log('📋 Testing Activities endpoints...');
    try {
      const activitiesResponse = await api.get('/activities');
      console.log('✅ GET /activities:', activitiesResponse.status);
      results.activities.list = true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      console.error('❌ GET /activities failed:', axiosError.response?.status, axiosError.response?.data);
    }
    
  } finally {
    // Restore original auth header
    if (originalAuth) {
      api.defaults.headers.common['Authorization'] = originalAuth;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }
  
  console.log('🧪 Authenticated API Test Results:', results);
  return results;
};

// Complete test flow
export const runCompleteAPITest = async () => {
  console.log('🚀 Running complete API test suite...');
  
  try {
    // Step 1: Test basic connectivity
    console.log('\n=== STEP 1: Basic Connectivity ===' );
    await testAllAPIs();
    
    // Step 2: Test authentication
    console.log('\n=== STEP 2: Authentication Flow ===');
    const authData = await testAuthFlow();
    
    if (authData?.access_token) {
      // Step 3: Test authenticated endpoints
      console.log('\n=== STEP 3: Authenticated Endpoints ===');
      await testAuthenticatedEndpoints(authData.access_token);
    } else {
      console.error('❌ No access token received, cannot test authenticated endpoints');
    }
    
    console.log('\n✅ Complete API test finished');
    
  } catch (error) {
    console.error('❌ Complete API test failed:', error);
  }
};