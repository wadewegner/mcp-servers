import { spawn } from 'child_process';
import readline from 'readline';

// Function to send a request to the MCP server
async function sendRequest(request) {
  return new Promise((resolve, reject) => {
    // Start the MCP server
    const mcp = spawn('node', ['build/index.js', 'digitalocean'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let responseData = '';
    let errorData = '';
    
    // Set up readline interface to read line by line
    const rl = readline.createInterface({
      input: mcp.stdout,
      crlfDelay: Infinity
    });
    
    // Process each line of output
    rl.on('line', (line) => {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          responseData = response;
        } catch (err) {
          console.error(`Failed to parse line: ${line}`);
        }
      }
    });
    
    // Collect stderr data (for debugging)
    mcp.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`[MCP stderr]: ${data.toString()}`);
    });
    
    // Handle process exit
    mcp.on('close', (code) => {
      if (code !== 0) {
        console.error(`MCP server exited with code ${code}`);
        console.error(`Error data: ${errorData}`);
        reject(new Error(`MCP server exited with code ${code}`));
      } else {
        if (responseData) {
          resolve(responseData);
        } else {
          console.error(`No valid JSON response received`);
          reject(new Error('No valid JSON response received'));
        }
      }
    });
    
    // Send the request
    mcp.stdin.write(JSON.stringify(request) + '\n');
    mcp.stdin.end();
  });
}

// Main function
async function main() {
  try {
    console.log('Testing deploy-static-site...');
    
    const request = {
      name: "deploy-static-site",
      parameters: {
        app_name: "test-static-site",
        region: "nyc",
        repo: "wadewegner/static-site-test",
        branch: "main",
        environment_slug: "html"
      }
    };
    
    console.log('Sending request:', JSON.stringify(request, null, 2));
    const response = await sendRequest(request);
    console.log('Response:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 