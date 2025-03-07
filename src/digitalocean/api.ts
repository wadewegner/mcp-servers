import { makeApiRequest } from '../shared/api.js';
import { 
  AppResponse, 
  AppSpec, 
  DeploymentListResponse, 
  DeploymentResponse, 
  LogResponse 
} from './types.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

export const DO_API_BASE = "https://api.digitalocean.com/v2";
export const DO_USER_AGENT = "mcp-digitalocean/1.0";

/**
 * Find the DigitalOcean API token from various locations
 * Checks in this order:
 * 1. Environment variables (DO_API_TOKEN or DIGITALOCEAN_API_TOKEN)
 * 2. .dotoken file in home directory
 * 3. .env file in project root
 * 4. ~/.config/digitalocean/token
 * 
 * @returns The API token if found, null otherwise
 */
export async function findApiToken(): Promise<string | null> {
  // 1. Check environment variables
  if (process.env.DO_API_TOKEN) {
    return process.env.DO_API_TOKEN;
  }
  if (process.env.DIGITALOCEAN_API_TOKEN) {
    return process.env.DIGITALOCEAN_API_TOKEN;
  }

  // 2. Check .dotoken file in home directory
  const homeDir = os.homedir();
  const dotokenPath = path.join(homeDir, '.dotoken');
  try {
    if (fs.existsSync(dotokenPath)) {
      const token = fs.readFileSync(dotokenPath, 'utf8').trim();
      if (token) {
        return token;
      }
    }
  } catch (error) {
    console.error('Error reading .dotoken file:', error);
  }

  // 3. Check .env file in project root
  try {
    // Get the project root directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '../../');
    const envPath = path.join(projectRoot, '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DO_API_TOKEN=(.+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
      
      const match2 = envContent.match(/DIGITALOCEAN_API_TOKEN=(.+)/);
      if (match2 && match2[1]) {
        return match2[1].trim();
      }
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }

  // 4. Check ~/.config/digitalocean/token
  try {
    const configDir = path.join(homeDir, '.config', 'digitalocean');
    const tokenPath = path.join(configDir, 'token');
    
    if (fs.existsSync(tokenPath)) {
      const token = fs.readFileSync(tokenPath, 'utf8').trim();
      if (token) {
        return token;
      }
    }
  } catch (error) {
    console.error('Error reading config token file:', error);
  }

  return null;
}

/**
 * Make a request to the DigitalOcean API
 */
export async function makeDigitalOceanRequest<T>(
  url: string, 
  method: string = 'GET', 
  body: any = null, 
  token: string
): Promise<T | null> {
  console.error(`Making DigitalOcean API request: ${method} ${url}`);
  console.error(`Using token: ${token.substring(0, 10)}...`);
  
  const headers: Record<string, string> = {
    "User-Agent": DO_USER_AGENT,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  try {
    const options: RequestInit = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
      console.error(`Request body: ${JSON.stringify(body)}`);
    }

    console.error(`Sending request to DigitalOcean API...`);
    const response = await fetch(url, options);
    
    // Always get the response text first
    const responseText = await response.text();
    console.error(`Response status: ${response.status}`);
    console.error(`Response body: ${responseText}`);
    
    if (!response.ok) {
      // Try to parse the error as JSON
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message) {
          errorMessage = `DigitalOcean API error: ${errorJson.message}`;
        } else if (errorJson.error) {
          errorMessage = `DigitalOcean API error: ${errorJson.error}`;
        } else if (errorJson.id) {
          errorMessage = `DigitalOcean API error ID: ${errorJson.id}`;
        }
        console.error(`Parsed error message: ${errorMessage}`);
      } catch (parseError) {
        console.error(`Could not parse error response as JSON: ${responseText}`);
      }
      throw new Error(errorMessage);
    }
    
    // For DELETE requests that return no content
    if (response.status === 204) {
      console.error(`Request successful (204 No Content)`);
      return {} as T;
    }
    
    // Parse the response as JSON
    try {
      const responseData = JSON.parse(responseText);
      console.error(`Request successful, received response`);
      return responseData as T;
    } catch (parseError) {
      console.error(`Error parsing response as JSON: ${parseError}`);
      throw new Error(`Failed to parse response as JSON: ${responseText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Error making DigitalOcean API request:", error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
}

/**
 * Create a new app on DigitalOcean App Platform
 */
export async function createApp(spec: AppSpec, token: string): Promise<string> {
  try {
    const url = `${DO_API_BASE}/apps`;
    // Wrap the app specification in a spec field
    const body = { spec };
    
    console.error(`Creating app with body: ${JSON.stringify(body)}`);
    const result = await makeDigitalOceanRequest<AppResponse>(url, 'POST', body, token);
    
    if (!result) {
      return "Failed to create app. No response from DigitalOcean API.";
    }
    
    const appUrl = result.app.live_url || `https://cloud.digitalocean.com/apps/${result.app.id}`;
    return `Successfully created app "${spec.name}"!\n\nApp ID: ${result.app.id}\nLive URL: ${appUrl}\nStatus: ${result.app.phase}`;
  } catch (error: any) {
    return `Error creating app: ${error.message || String(error)}`;
  }
}

/**
 * Get app information
 */
export async function getAppInfo(appId: string, token: string): Promise<string> {
  try {
    const url = `${DO_API_BASE}/apps/${appId}`;
    const result = await makeDigitalOceanRequest<AppResponse>(url, 'GET', null, token);
    
    if (!result) {
      return `Failed to get app info for app ID: ${appId}. No response from DigitalOcean API.`;
    }
    
    const app = result.app;
    return `App Name: ${app.spec.name}\nID: ${app.id}\nCreated: ${app.created_at}\nUpdated: ${app.updated_at}\nRegion: ${app.region.slug}\nTier: ${app.tier_slug}\nLive URL: ${app.live_url || "Not available yet"}\nStatus: ${app.phase}`;
  } catch (error: any) {
    return `Error getting app info: ${error.message || String(error)}`;
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(appId: string, deploymentId: string, token: string): Promise<string> {
  try {
    const url = `${DO_API_BASE}/apps/${appId}/deployments/${deploymentId}`;
    const result = await makeDigitalOceanRequest<DeploymentResponse>(url, 'GET', null, token);
    
    if (!result) {
      return `Failed to get deployment status for app ID: ${appId}, deployment ID: ${deploymentId}. No response from DigitalOcean API.`;
    }
    
    const deployment = result.deployment;
    return `Deployment ID: ${deployment.id}\nStatus: ${deployment.phase}\nCreated: ${deployment.created_at}\nUpdated: ${deployment.updated_at}\nProgress: ${deployment.progress?.steps_completed || 0}/${deployment.progress?.steps_total || 0} steps completed`;
  } catch (error: any) {
    return `Error getting deployment status: ${error.message || String(error)}`;
  }
}

/**
 * List deployments for an app
 */
export async function listDeployments(appId: string, token: string): Promise<string> {
  try {
    const url = `${DO_API_BASE}/apps/${appId}/deployments`;
    const result = await makeDigitalOceanRequest<DeploymentListResponse>(url, 'GET', null, token);
    
    if (!result) {
      return `Failed to list deployments for app ID: ${appId}. No response from DigitalOcean API.`;
    }
    
    if (result.deployments.length === 0) {
      return `No deployments found for app ID: ${appId}`;
    }
    
    let output = `Deployments for app ID: ${appId}\n\n`;
    result.deployments.forEach((deployment, index) => {
      output += `${index + 1}. ID: ${deployment.id}\n   Status: ${deployment.phase}\n   Created: ${deployment.created_at}\n   Updated: ${deployment.updated_at}\n\n`;
    });
    
    return output;
  } catch (error: any) {
    return `Error listing deployments: ${error.message || String(error)}`;
  }
}

/**
 * Create a new deployment (redeploy)
 */
export async function createDeployment(appId: string, forceBuild: boolean, token: string): Promise<string> {
  try {
    const url = `${DO_API_BASE}/apps/${appId}/deployments`;
    const body = forceBuild ? { force_build: true } : {};
    const result = await makeDigitalOceanRequest<DeploymentResponse>(url, 'POST', body, token);
    
    if (!result) {
      return `Failed to create deployment for app ID: ${appId}. No response from DigitalOcean API.`;
    }
    
    const deployment = result.deployment;
    return `Successfully created deployment!\n\nDeployment ID: ${deployment.id}\nStatus: ${deployment.phase}\nCreated: ${deployment.created_at}`;
  } catch (error: any) {
    return `Error creating deployment: ${error.message || String(error)}`;
  }
}

/**
 * Get deployment logs
 */
export async function getDeploymentLogs(appId: string, deploymentId: string, token: string): Promise<string> {
  try {
    const url = `${DO_API_BASE}/apps/${appId}/deployments/${deploymentId}/logs`;
    const result = await makeDigitalOceanRequest<LogResponse>(url, 'GET', null, token);
    
    if (!result) {
      return `Failed to get logs for app ID: ${appId}, deployment ID: ${deploymentId}. No response from DigitalOcean API.`;
    }
    
    if (!result.historic_urls || result.historic_urls.length === 0) {
      return `No logs available for deployment ID: ${deploymentId}`;
    }
    
    // Get the most recent logs
    const logUrl = result.live_url || result.historic_urls[0];
    
    try {
      const logResponse = await fetch(logUrl);
      if (!logResponse.ok) {
        return `Failed to fetch logs from URL: ${logUrl}. Status: ${logResponse.status}`;
      }
      
      const logs = await logResponse.text();
      return logs.length > 0 ? logs : "No log content available";
    } catch (logError: any) {
      return `Error fetching logs from URL: ${logError.message || String(logError)}`;
    }
  } catch (error: any) {
    return `Error getting deployment logs: ${error.message || String(error)}`;
  }
}

/**
 * Delete an app
 */
export async function deleteApp(appId: string, token: string): Promise<string> {
  try {
    const url = `${DO_API_BASE}/apps/${appId}`;
    await makeDigitalOceanRequest(url, 'DELETE', null, token);
    return `Successfully deleted app with ID: ${appId}`;
  } catch (error: any) {
    return `Error deleting app: ${error.message || String(error)}`;
  }
} 