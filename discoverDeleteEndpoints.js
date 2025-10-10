#!/usr/bin/env node

/**
 * Backend Endpoint Discovery Tool
 * Tests common delete account endpoints to find which ones are actually implemented
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const TEST_ENDPOINTS = [
  // Standard delete account endpoints
  { method: 'DELETE', path: '/auth/account', name: 'Auth Account Delete' },
  { method: 'POST', path: '/auth/delete-account', name: 'Auth Delete Account', data: { password: 'test123' } },
  { method: 'DELETE', path: '/users/me', name: 'Current User Delete' },
  { method: 'POST', path: '/users/delete', name: 'Users Delete', data: { password: 'test123' } },
  { method: 'POST', path: '/auth/delete', name: 'Auth Delete', data: { password: 'test123' } },
  
  // User management endpoints
  { method: 'DELETE', path: '/users/:id', name: 'User by ID Delete' },
  { method: 'POST', path: '/users/:id/delete', name: 'User by ID Delete with Password' },
  
  // Password verification
  { method: 'POST', path: '/auth/verify-password', name: 'Password Verification', data: { password: 'test123' } },
  
  // Alternative patterns
  { method: 'PATCH', path: '/users/me', name: 'User Soft Delete', data: { deleted: true } },
  { method: 'POST', path: '/account/delete', name: 'Account Delete' },
  { method: 'DELETE', path: '/api/users/current', name: 'API Current User Delete' },
];

async function testEndpoint(endpoint) {
  const { method, path, name, data } = endpoint;
  const url = `${API_BASE_URL}${path}`;
  
  try {
    const config = {
      method: method.toLowerCase(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-for-discovery'
      }
    };
    
    if (data && (method === 'POST' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, config);
    
    return {
      endpoint: `${method} ${path}`,
      name,
      status: response.status,
      available: response.status !== 404,
      error: null
    };
  } catch (error) {
    return {
      endpoint: `${method} ${path}`,
      name,
      status: 'ERROR',
      available: false,
      error: error.message
    };
  }
}

async function discoverBackendEndpoints() {
  console.log(` Discovering Backend Delete Account Endpoints...`);
  console.log(` Testing against: ${API_BASE_URL}\n`);
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const statusColor = result.status === 404 ? '' : 
                       result.status === 'ERROR' ? '' : 
                       result.available ? '' : '';
    
    console.log(`${statusColor} ${result.endpoint.padEnd(30)} | ${result.name.padEnd(25)} | Status: ${result.status}`);
    
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }
  
  const availableEndpoints = results.filter(r => r.available && r.status !== 'ERROR');
  
  console.log(`\n Summary:`);
  console.log(`   Total endpoints tested: ${results.length}`);
  console.log(`   Available endpoints: ${availableEndpoints.length}`);
  console.log(`   Not found (404): ${results.filter(r => r.status === 404).length}`);
  console.log(`   Connection errors: ${results.filter(r => r.status === 'ERROR').length}`);
  
  if (availableEndpoints.length > 0) {
    console.log(`\n Available Delete Account Endpoints:`);
    availableEndpoints.forEach(endpoint => {
      console.log(`   • ${endpoint.endpoint} - ${endpoint.name}`);
    });
    
    console.log(`\n Recommended app.json configuration:`);
    console.log(`{`);
    console.log(`  "expo": {`);
    console.log(`    "extra": {`);
    console.log(`      "deleteAccountEndpoints": [`);
    availableEndpoints.forEach((endpoint, index) => {
      const isLast = index === availableEndpoints.length - 1;
      console.log(`        "${endpoint.endpoint.toLowerCase()}"${isLast ? '' : ','}`);
    });
    console.log(`      ]`);
    console.log(`    }`);
    console.log(`  }`);
    console.log(`}`);
  } else {
    console.log(`\n No delete account endpoints found!`);
    console.log(`\n Backend needs to implement one of these endpoints:`);
    console.log(`   • POST /auth/delete-account (with password in body)`);
    console.log(`   • DELETE /users/me (current user deletion)`);
    console.log(`   • POST /auth/verify-password + DELETE /auth/account`);
  }
}

// Check if backend is running first
async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    try {
      const response = await fetch(API_BASE_URL, { method: 'GET' });
      return true; // Any response means backend is running
    } catch {
      return false;
    }
  }
}

async function main() {
  const isBackendRunning = await checkBackend();
  
  if (!isBackendRunning) {
    console.log(` Backend not reachable at ${API_BASE_URL}`);
    console.log(`\n To test endpoints:`);
    console.log(`   1. Start your backend server`);
    console.log(`   2. Set API_BASE_URL if different: API_BASE_URL=http://localhost:3001 node discoverDeleteEndpoints.js`);
    return;
  }
  
  console.log(` Backend is reachable at ${API_BASE_URL}\n`);
  await discoverBackendEndpoints();
}

main().catch(console.error);