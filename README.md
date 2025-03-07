# MCP Weather

A collection of Model Context Protocol (MCP) servers for use with Cursor.

## Project Structure

```
src/
├── index.ts              # Main entry point
├── shared/               # Shared utilities
│   └── api.ts            # Shared API utilities
├── weather/              # Weather MCP server
│   ├── api.ts            # Weather API functions
│   ├── server.ts         # Weather MCP server configuration
│   └── types.ts          # Weather API types
└── template/             # Template for new MCP servers
    ├── api.ts            # Template API functions
    ├── server.ts         # Template MCP server configuration
    └── types.ts          # Template API types
```

## Available MCP Servers

### Weather Server

The Weather MCP server provides tools for accessing weather information from the National Weather Service API.

#### Tools:

- **get-alerts**: Get weather alerts for a US state
  - Parameters: `state` (two-letter state code, e.g., CA, NY)

- **get-forecast**: Get weather forecast for a location
  - Parameters: `latitude` and `longitude` coordinates

## Adding a New MCP Server

To add a new MCP server:

1. Copy the `template` directory and rename it to your server name
2. Update the types, API functions, and server configuration
3. Add your server to the main `index.ts` file

## Building and Running

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the MCP server
node build/index.js
```

## Cursor Integration

To use with Cursor, add the following to your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": [
        "/path/to/your/project/build/index.js"
      ]
    }
  }
}
``` 