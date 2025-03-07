# MCP Weather & DigitalOcean

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
├── digitalocean/         # DigitalOcean MCP server
│   ├── api.ts            # DigitalOcean API functions
│   ├── server.ts         # DigitalOcean MCP server configuration
│   └── types.ts          # DigitalOcean API types
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

### DigitalOcean Server

The DigitalOcean MCP server provides tools for deploying and managing static websites on DigitalOcean App Platform using their API.

#### Tools:

- **deploy-static-site**: Deploy a static website to DigitalOcean App Platform
  - Parameters:
    - `token`: DigitalOcean API token with write access
    - `app_name`: Name for your app
    - `region`: Region code (e.g., nyc, sfo)
    - `repo`: GitHub repository (username/repo)
    - `branch`: Branch to deploy (default: main)
    - `source_dir`: Directory in repo containing source code (default: /)
    - `build_command`: Build command (if needed)
    - `output_dir`: Directory where build outputs files
    - `deploy_on_push`: Auto-deploy on git push (default: true)
    - `environment_slug`: Runtime environment (html, node-js, etc.) (default: html)
    - `custom_domain`: Custom domain (optional)

- **get-app-info**: Get information about a DigitalOcean App Platform app
  - Parameters:
    - `token`: DigitalOcean API token
    - `app_id`: App ID

- **get-deployment-status**: Get the status of a specific deployment
  - Parameters:
    - `token`: DigitalOcean API token
    - `app_id`: App ID
    - `deployment_id`: Deployment ID

- **list-deployments**: List all deployments for an app
  - Parameters:
    - `token`: DigitalOcean API token
    - `app_id`: App ID

- **create-deployment**: Create a new deployment (redeploy an app)
  - Parameters:
    - `token`: DigitalOcean API token
    - `app_id`: App ID
    - `force_build`: Force a rebuild without cache (default: false)

- **get-deployment-logs**: Get logs for a deployment
  - Parameters:
    - `token`: DigitalOcean API token
    - `app_id`: App ID
    - `deployment_id`: Deployment ID

- **delete-app**: Delete an app from DigitalOcean App Platform
  - Parameters:
    - `token`: DigitalOcean API token
    - `app_id`: App ID

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

# Run the Weather MCP server
node build/index.js

# Run the DigitalOcean MCP server
node build/index.js digitalocean
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
    },
    "digitalocean": {
      "command": "node",
      "args": [
        "/path/to/your/project/build/index.js",
        "digitalocean"
      ]
    }
  }
}
``` 