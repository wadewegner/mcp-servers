import fs from 'fs';
import os from 'os';
import path from 'path';

// Read the token file
const homeDir = os.homedir();
const dotokenPath = path.join(homeDir, '.dotoken');
let token = null;

try {
  if (fs.existsSync(dotokenPath)) {
    token = fs.readFileSync(dotokenPath, 'utf8').trim();
    console.log('Found token in ~/.dotoken');
  }
} catch (error) {
  console.error('Error reading token file:', error);
}

if (!token) {
  console.error('No token found');
  process.exit(1);
}

// Make a request to the DigitalOcean API
async function makeRequest(url, method = 'GET', body = null) {
  console.log(`Making ${method} request to ${url}`);
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'mcp-digitalocean/1.0'
  };
  
  const options = {
    method,
    headers
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
    console.log('Request body:', JSON.stringify(body, null, 2));
  }
  
  try {
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('Response body:', JSON.stringify(responseJson, null, 2));
      return responseJson;
    } catch (e) {
      console.log('Response body (not JSON):', responseText);
      return responseText;
    }
  } catch (error) {
    console.error('Error making request:', error);
    return null;
  }
}

// Test creating an app
async function testCreateApp() {
  const appSpec = {
    spec: {
      name: "test-static-site",
      region: "nyc",
      static_sites: [
        {
          name: "website",
          github: {
            repo: "digitalocean/sample-golang",
            branch: "main",
            deploy_on_push: true
          },
          environment_slug: "html",
          source_dir: "/"
        }
      ]
    }
  };
  
  const result = await makeRequest('https://api.digitalocean.com/v2/apps', 'POST', appSpec);
  return result;
}

// Run the test
testCreateApp().then(result => {
  console.log('Test complete');
}); 