import { startWeatherServer } from './weather/server.js';
import { startDigitalOceanServer, createDigitalOceanServer } from './digitalocean/server.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Main entry point
 */
async function main() {
  // Determine which server to start based on command line arguments
  const args = process.argv.slice(2);
  const serverType = args[0] || 'weather'; // Default to weather if no argument provided
  
  switch (serverType) {
    case 'digitalocean':
      console.error('Starting DigitalOcean MCP Server...');
      const server = createDigitalOceanServer();
      startDigitalOceanServer(server);
      break;
    case 'weather':
    default:
      console.error('Starting Weather MCP Server...');
      await startWeatherServer();
      break;
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});