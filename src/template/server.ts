import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getExampleData } from './api.js';

/**
 * Create and configure the example MCP server
 * Replace this with your own server configuration
 */
export function createExampleServer(): McpServer {
  const server = new McpServer({
    name: "example",
    version: "1.0.0",
  });

  // Register example tool
  server.tool(
    "example-tool",
    "Example tool description",
    {
      param: z.string().describe("Parameter description"),
    },
    async ({ param }) => {
      const resultText = await getExampleData(param);
      
      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    },
  );

  return server;
}

/**
 * Start the example MCP server
 */
export async function startExampleServer(): Promise<void> {
  const server = createExampleServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error("Example MCP Server running on stdio");
} 