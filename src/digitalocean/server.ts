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
  deleteApp 
} from './api.js';
import { AppSpec, StaticSite, GitSource, Domain, Alert, EnvironmentVariable } from './types.js';

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
      token: z.string().describe("DigitalOcean API token with write access"),
      app_name: z.string().describe("Name for your app"),
      region: z.string().describe("Region code (e.g., nyc, sfo)"),
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

      // Create the app
      const result = await createApp(appSpec, token);
      
      return {
        content: [
          {
            type: "text",
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
      token: z.string().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID")
    },
    async ({ token, app_id }) => {
      const result = await getAppInfo(app_id, token);
      
      return {
        content: [
          {
            type: "text",
            text: result
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
      token: z.string().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID"),
      deployment_id: z.string().describe("Deployment ID")
    },
    async ({ token, app_id, deployment_id }) => {
      const result = await getDeploymentStatus(app_id, deployment_id, token);
      
      return {
        content: [
          {
            type: "text",
            text: result
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
      token: z.string().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID")
    },
    async ({ token, app_id }) => {
      const result = await listDeployments(app_id, token);
      
      return {
        content: [
          {
            type: "text",
            text: result
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
      token: z.string().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID"),
      force_build: z.boolean().default(false).describe("Force a rebuild without cache")
    },
    async ({ token, app_id, force_build }) => {
      const result = await createDeployment(app_id, force_build, token);
      
      return {
        content: [
          {
            type: "text",
            text: result
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
      token: z.string().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID"),
      deployment_id: z.string().describe("Deployment ID")
    },
    async ({ token, app_id, deployment_id }) => {
      const result = await getDeploymentLogs(app_id, deployment_id, token);
      
      return {
        content: [
          {
            type: "text",
            text: result
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
      token: z.string().describe("DigitalOcean API token"),
      app_id: z.string().describe("App ID")
    },
    async ({ token, app_id }) => {
      const result = await deleteApp(app_id, token);
      
      return {
        content: [
          {
            type: "text",
            text: result
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
export async function startDigitalOceanServer(): Promise<void> {
  const server = createDigitalOceanServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error("DigitalOcean MCP Server running on stdio");
} 