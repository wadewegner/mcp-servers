import { startWeatherServer } from './weather/server.js';

/**
 * Main entry point
 */
async function main() {
  // Start the weather MCP server
  await startWeatherServer();
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});