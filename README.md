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
tests/                    # Test scripts and files
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

#### API Token Handling

The DigitalOcean MCP server will automatically look for your API token in the following locations (in order):

1. As a parameter in the tool call
2. Environment variables: `DO_API_TOKEN` or `DIGITALOCEAN_API_TOKEN`
3. A file at `~/.dotoken` containing just the token
4. A `.env` file in the project root with `DO_API_TOKEN=your_token`
5. A file at `~/.config/digitalocean/token` containing just the token

This means you can set up your token once and not have to provide it with every command.

#### Tools:

- **deploy-static-site**: Deploy a static website to DigitalOcean App Platform
  - Required Parameters:
    - `app_name`: Name for your app
    - `repo`: GitHub repository (username/repo)
  - Optional Parameters:
    - `token`: DigitalOcean API token (optional if stored in environment or config files)
    - `region`: Region code (e.g., nyc, sfo) - Default: "nyc"
    - `branch`: Branch to deploy - Default: "main"
    - `source_dir`: Directory in repo containing source code - Default: "/"
    - `build_command`: Build command (if needed)
    - `output_dir`: Directory where build outputs files
    - `deploy_on_push`: Auto-deploy on git push - Default: true
    - `environment_slug`: Runtime environment - Default: "html"
    - `custom_domain`: Custom domain (optional)

- **get-app-info**: Get information about a DigitalOcean App Platform app
  - Required Parameters:
    - `app_id`: App ID
  - Optional Parameters:
    - `token`: DigitalOcean API token (optional if stored in environment or config files)

- **get-deployment-status**: Get the status of a specific deployment
  - Required Parameters:
    - `app_id`: App ID
    - `deployment_id`: Deployment ID
  - Optional Parameters:
    - `token`: DigitalOcean API token (optional if stored in environment or config files)

- **list-deployments**: List all deployments for an app
  - Required Parameters:
    - `app_id`: App ID
  - Optional Parameters:
    - `token`: DigitalOcean API token (optional if stored in environment or config files)

- **create-deployment**: Create a new deployment (redeploy an app)
  - Required Parameters:
    - `app_id`: App ID
  - Optional Parameters:
    - `token`: DigitalOcean API token (optional if stored in environment or config files)
    - `force_build`: Force a rebuild without cache - Default: false

- **get-deployment-logs**: Get logs for a deployment
  - Required Parameters:
    - `app_id`: App ID
    - `deployment_id`: Deployment ID
  - Optional Parameters:
    - `token`: DigitalOcean API token (optional if stored in environment or config files)

- **delete-app**: Delete an app from DigitalOcean App Platform
  - Required Parameters:
    - `app_id`: App ID
  - Optional Parameters:
    - `token`: DigitalOcean API token (optional if stored in environment or config files)

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

## Testing

The project includes several test scripts in the `tests/` directory:

- `test-simple.mjs`: A simple test script that sends JSON-RPC requests to the MCP server
- `test-api.mjs`: A script that directly tests the DigitalOcean API
- `test-mcp.mjs`: A more comprehensive test for the MCP server
- `test-deploy.mjs`: A test script specifically for the deploy-static-site tool
- `token-test.mjs`: A utility script to verify that the DigitalOcean API token can be read correctly

To run a test:

```bash
# Run a test script
node tests/test-simple.mjs
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