import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { 
  createApp, 
  getAppInfo, 
  getDeploymentStatus, 
  listDeployments, 
  createDeployment, 
  getDeploymentLogs, 
  deleteApp,
  findApiToken
} from './api.js';
import { AppSpec, StaticSite, GitSource, Domain, Alert, EnvironmentVariable } from './types.js';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Create and configure the DigitalOcean MCP server
 */
export function createDigitalOceanServer(): McpServer {
  const server = new McpServer({
    name: "digitalocean",
    version: "1.0.0",
  });

  // Register deploy-static-site tool
  server.tool(
    "deploy-static-site",
    "Deploy a static website to DigitalOcean App Platform",
    {
      token: z.string().optional().describe("DigitalOcean API token with write access (optional if stored in environment or config files)"),
      app_name: z.string().describe("Name for your app"),
      region: z.string().default("nyc").describe("Region code (e.g., nyc, sfo)"),
      repo: z.string().describe("GitHub repository (username/repo)"),
      branch: z.string().default("main").describe("Branch to deploy"),
      source_dir: z.string().default("/").describe("Directory in repo containing source code"),
      build_command: z.string().optional().describe("Build command (if needed)"),
      output_dir: z.string().optional().describe("Directory where build outputs files"),
      deploy_on_push: z.boolean().default(true).describe("Auto-deploy on git push"),
      environment_slug: z.string().default("html").describe("Runtime environment (html, node-js, etc.)"),
      custom_domain: z.string().optional().describe("Custom domain (optional)")
    },
    async ({ 
      token, 
      app_name, 
      region, 
      repo, 
      branch, 
      source_dir, 
      build_command, 
      output_dir, 
      deploy_on_push, 
      environment_slug,
      custom_domain
    }) => {
      console.error(`Deploy static site called with app_name=${app_name}, repo=${repo}`);
      
      // Get token (from parameter or environment)
      let apiToken = token;
      if (!apiToken) {
        console.error("No token provided, checking environment...");
        const foundToken = await findApiToken();
        if (foundToken) {
          apiToken = foundToken;
          console.error("Found token in environment or config files");
        } else {
          console.error("No token found in environment or config files");
          const errorText = "Error: DigitalOcean API token not found. Please provide your DigitalOcean API token using the token parameter.";
          console.error("Returning error:", errorText);
          return {
            content: [
              {
                type: "text" as const,
                text: errorText
              }
            ]
          };
        }
      } else {
        console.error("Using provided token");
      }

      // Create static site configuration
      const staticSite: StaticSite = {
        name: "website",
        github: {
          repo,
          branch,
          deploy_on_push
        },
        environment_slug,
        source_dir,
      };

      // Add optional fields if provided
      if (build_command) staticSite.build_command = build_command;
      if (output_dir) staticSite.output_dir = output_dir;

      // Create app spec
      const appSpec: AppSpec = {
        name: app_name,
        region,
        static_sites: [staticSite]
      };

      // Add custom domain if provided
      if (custom_domain) {
        appSpec.domains = [{
          name: custom_domain,
          type: "PRIMARY"
        }];
      }

      console.error(`Creating app with spec: ${JSON.stringify(appSpec)}`);
      
      // Create the app
      const result = await createApp(appSpec, apiToken);
      console.error(`App creation result: ${result}`);
      
      // Check if the result contains an error message about GitHub access
      if (result.includes("GitHub user does not have access to")) {
        const errorText = `${result}\n\nTo fix this issue:\n1. Make sure the repository exists\n2. Connect your GitHub account to DigitalOcean: https://cloud.digitalocean.com/apps/github/install\n3. Grant DigitalOcean access to the repository`;
        console.error("Returning GitHub access error:", errorText);
        return {
          content: [
            {
              type: "text" as const,
              text: errorText
            }
          ]
        };
      }
      
      // Check if the result contains an error message about an app with the same name
      if (result.includes("app with this name already exists")) {
        const errorText = `${result}\n\nTo fix this issue:\n1. Choose a different app name\n2. Or delete the existing app with this name`;
        console.error("Returning app name error:", errorText);
        return {
          content: [
            {
              type: "text" as const,
              text: errorText
            }
          ]
        };
      }
      
      console.error("Returning result:", result);
      return {
        content: [
          {
            type: "text" as const,
            text: result
          }
        ]
      };
    }
  );

  // Register get-app-info tool
  server.tool(
    "get-app-info",
    "Get information about a DigitalOcean App Platform app",
    {
      token: z.string().optional().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID")
    },
    async ({ token, app_id }) => {
      console.error(`Get app info called with app_id=${app_id}`);
      
      // Get token (from parameter or environment)
      let apiToken = token;
      if (!apiToken) {
        console.error("No token provided, checking environment...");
        const foundToken = await findApiToken();
        if (foundToken) {
          apiToken = foundToken;
          console.error("Found token in environment or config files");
        } else {
          console.error("No token found in environment or config files");
          const errorText = "Error: DigitalOcean API token not found. Please provide your DigitalOcean API token using the token parameter.";
          console.error("Returning error:", errorText);
          return {
            content: [
              {
                type: "text" as const,
                text: errorText
              }
            ]
          };
        }
      } else {
        console.error("Using provided token");
      }

      const appInfo = await getAppInfo(app_id, apiToken);
      console.error("App info result:", appInfo);
      
      return {
        content: [
          {
            type: "text" as const,
            text: appInfo
          }
        ]
      };
    }
  );

  // Register get-deployment-status tool
  server.tool(
    "get-deployment-status",
    "Get the status of a specific deployment",
    {
      token: z.string().optional().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID"),
      deployment_id: z.string().describe("Deployment ID")
    },
    async ({ token, app_id, deployment_id }) => {
      console.error(`Get deployment status called with app_id=${app_id}, deployment_id=${deployment_id}`);
      
      // Get token (from parameter or environment)
      let apiToken = token;
      if (!apiToken) {
        console.error("No token provided, checking environment...");
        const foundToken = await findApiToken();
        if (foundToken) {
          apiToken = foundToken;
          console.error("Found token in environment or config files");
        } else {
          console.error("No token found in environment or config files");
          return {
            content: [
              {
                type: "text",
                text: "Error: DigitalOcean API token not found. Please provide your DigitalOcean API token using the token parameter."
              }
            ]
          };
        }
      } else {
        console.error("Using provided token");
      }

      const deploymentStatus = await getDeploymentStatus(app_id, deployment_id, apiToken);
      
      return {
        content: [
          {
            type: "text",
            text: deploymentStatus
          }
        ]
      };
    }
  );

  // Register list-deployments tool
  server.tool(
    "list-deployments",
    "List all deployments for an app",
    {
      token: z.string().optional().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID")
    },
    async ({ token, app_id }) => {
      console.error(`List deployments called with app_id=${app_id}`);
      
      // Get token (from parameter or environment)
      let apiToken = token;
      if (!apiToken) {
        console.error("No token provided, checking environment...");
        const foundToken = await findApiToken();
        if (foundToken) {
          apiToken = foundToken;
          console.error("Found token in environment or config files");
        } else {
          console.error("No token found in environment or config files");
          return {
            content: [
              {
                type: "text",
                text: "Error: DigitalOcean API token not found. Please provide your DigitalOcean API token using the token parameter."
              }
            ]
          };
        }
      } else {
        console.error("Using provided token");
      }

      const deployments = await listDeployments(app_id, apiToken);
      
      return {
        content: [
          {
            type: "text",
            text: deployments
          }
        ]
      };
    }
  );

  // Register create-deployment tool
  server.tool(
    "create-deployment",
    "Create a new deployment (redeploy an app)",
    {
      token: z.string().optional().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID"),
      force_build: z.boolean().default(false).describe("Force a rebuild without cache")
    },
    async ({ token, app_id, force_build }) => {
      console.error(`Create deployment called with app_id=${app_id}, force_build=${force_build}`);
      
      // Get token (from parameter or environment)
      let apiToken = token;
      if (!apiToken) {
        console.error("No token provided, checking environment...");
        const foundToken = await findApiToken();
        if (foundToken) {
          apiToken = foundToken;
          console.error("Found token in environment or config files");
        } else {
          console.error("No token found in environment or config files");
          return {
            content: [
              {
                type: "text",
                text: "Error: DigitalOcean API token not found. Please provide your DigitalOcean API token using the token parameter."
              }
            ]
          };
        }
      } else {
        console.error("Using provided token");
      }

      const deploymentResult = await createDeployment(app_id, force_build, apiToken);
      
      return {
        content: [
          {
            type: "text",
            text: deploymentResult
          }
        ]
      };
    }
  );

  // Register get-deployment-logs tool
  server.tool(
    "get-deployment-logs",
    "Get logs for a deployment",
    {
      token: z.string().optional().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID"),
      deployment_id: z.string().describe("Deployment ID")
    },
    async ({ token, app_id, deployment_id }) => {
      console.error(`Get deployment logs called with app_id=${app_id}, deployment_id=${deployment_id}`);
      
      // Get token (from parameter or environment)
      let apiToken = token;
      if (!apiToken) {
        console.error("No token provided, checking environment...");
        const foundToken = await findApiToken();
        if (foundToken) {
          apiToken = foundToken;
          console.error("Found token in environment or config files");
        } else {
          console.error("No token found in environment or config files");
          return {
            content: [
              {
                type: "text",
                text: "Error: DigitalOcean API token not found. Please provide your DigitalOcean API token using the token parameter."
              }
            ]
          };
        }
      } else {
        console.error("Using provided token");
      }

      const logs = await getDeploymentLogs(app_id, deployment_id, apiToken);
      
      return {
        content: [
          {
            type: "text",
            text: logs
          }
        ]
      };
    }
  );

  // Register delete-app tool
  server.tool(
    "delete-app",
    "Delete an app from DigitalOcean App Platform",
    {
      token: z.string().optional().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID")
    },
    async ({ token, app_id }) => {
      console.error(`Delete app called with app_id=${app_id}`);
      
      // Get token (from parameter or environment)
      let apiToken = token;
      if (!apiToken) {
        console.error("No token provided, checking environment...");
        const foundToken = await findApiToken();
        if (foundToken) {
          apiToken = foundToken;
          console.error("Found token in environment or config files");
        } else {
          console.error("No token found in environment or config files");
          return {
            content: [
              {
                type: "text",
                text: "Error: DigitalOcean API token not found. Please provide your DigitalOcean API token using the token parameter."
              }
            ]
          };
        }
      } else {
        console.error("Using provided token");
      }

      const deleteResult = await deleteApp(app_id, apiToken);
      
      return {
        content: [
          {
            type: "text",
            text: deleteResult
          }
        ]
      };
    }
  );

  return server;
}

/**
 * Start the DigitalOcean MCP server
 */
export function startDigitalOceanServer(server: any) {
  console.error("Starting DigitalOcean MCP Server...");
  
  // Check if token is available at startup
  findApiToken().then(token => {
    if (token) {
      console.error("DigitalOcean API token found in environment or config files. You can use DigitalOcean tools without explicitly providing a token.");
    } else {
      console.error("No DigitalOcean API token found. You will need to provide a token when using DigitalOcean tools.");
    }
  });
  
  const transport = new StdioServerTransport();
  
  console.error("DigitalOcean MCP Server running on stdio");
  
  return server.connect(transport);
} 