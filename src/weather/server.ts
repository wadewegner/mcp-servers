import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAlertsForState, getForecastForLocation } from './api.js';

/**
 * Create and configure the weather MCP server
 */
export function createWeatherServer(): McpServer {
  const server = new McpServer({
    name: "weather",
    version: "1.0.0",
  });

  // Register get-alerts tool
  server.tool(
    "get-alerts",
    "Get weather alerts for a state",
    {
      state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
    },
    async ({ state }) => {
      const stateCode = state.toUpperCase();
      const alertsText = await getAlertsForState(stateCode);
      
      return {
        content: [
          {
            type: "text",
            text: alertsText,
          },
        ],
      };
    },
  );

  // Register get-forecast tool
  server.tool(
    "get-forecast",
    "Get weather forecast for a location",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
      longitude: z.number().min(-180).max(180).describe("Longitude of the location"),
    },
    async ({ latitude, longitude }) => {
      const forecastText = await getForecastForLocation(latitude, longitude);
      
      return {
        content: [
          {
            type: "text",
            text: forecastText,
          },
        ],
      };
    },
  );

  return server;
}

/**
 * Start the weather MCP server
 */
export async function startWeatherServer(): Promise<void> {
  const server = createWeatherServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
} 