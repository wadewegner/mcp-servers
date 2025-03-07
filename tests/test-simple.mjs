import { spawn } from 'child_process';

// Start the MCP server
const mcp = spawn('node', ['build/index.js', 'digitalocean'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Log stdout
mcp.stdout.on('data', (data) => {
  console.log(`[stdout]: ${data.toString()}`);
});

// Log stderr
mcp.stderr.on('data', (data) => {
  console.log(`[stderr]: ${data.toString()}`);
});

// Handle process exit
mcp.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
});

// Send a request
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

// Format the request as a JSON-RPC request to list tools
const listToolsRequest = {
  jsonrpc: "2.0",
  id: "1",
  method: "tools/list",
  params: {}
};

console.log('Sending list tools request:', JSON.stringify(listToolsRequest));
mcp.stdin.write(JSON.stringify(listToolsRequest) + '\n');

// Wait a bit before sending the deploy request
setTimeout(() => {
  // Format the request as a JSON-RPC request to call a tool
  const callToolRequest = {
    jsonrpc: "2.0",
    id: "2",
    method: "tools/call",
    params: {
      name: request.name,
      arguments: request.parameters
    }
  };
  
  console.log('Sending call tool request:', JSON.stringify(callToolRequest));
  mcp.stdin.write(JSON.stringify(callToolRequest) + '\n');
}, 1000);

// Keep the process running for a bit to see the response
setTimeout(() => {
  console.log('Closing...');
  mcp.stdin.end();
}, 5000); 