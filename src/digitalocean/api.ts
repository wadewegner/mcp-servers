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
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // For DELETE requests that return no content
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error("Error making DigitalOcean API request:", error);
    return null;
  }
}

/**
 * Create a new app on DigitalOcean App Platform
 */
export async function createApp(spec: AppSpec, token: string): Promise<string> {
  const url = `${DO_API_BASE}/apps`;
  const body = { spec };
  
  const response = await makeDigitalOceanRequest<AppResponse>(url, 'POST', body, token);
  
  if (!response) {
    return "Failed to create app. Check your token and app specification.";
  }
  
  const appId = response.app.id;
  const defaultUrl = response.app.default_ingress;
  const deploymentPhase = response.app.active_deployment?.phase || "UNKNOWN";
  
  return `App created successfully!\nApp ID: ${appId}\nDefault URL: ${defaultUrl}\nDeployment Status: ${deploymentPhase}`;
}

/**
 * Get app information
 */
export async function getAppInfo(appId: string, token: string): Promise<string> {
  const url = `${DO_API_BASE}/apps/${appId}`;
  
  const response = await makeDigitalOceanRequest<AppResponse>(url, 'GET', null, token);
  
  if (!response) {
    return "Failed to get app information. Check your token and app ID.";
  }
  
  const app = response.app;
  const deploymentStatus = app.active_deployment?.phase || "No active deployment";
  
  return `App: ${app.spec.name}\nID: ${app.id}\nURL: ${app.default_ingress}\nDeployment Status: ${deploymentStatus}\nCreated: ${app.created_at}`;
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(appId: string, deploymentId: string, token: string): Promise<string> {
  const url = `${DO_API_BASE}/apps/${appId}/deployments/${deploymentId}`;
  
  const response = await makeDigitalOceanRequest<{ deployment: DeploymentResponse }>(url, 'GET', null, token);
  
  if (!response) {
    return "Failed to get deployment status. Check your token, app ID, and deployment ID.";
  }
  
  const deployment = response.deployment;
  
  return `Deployment ID: ${deployment.id}\nStatus: ${deployment.phase}\nCreated: ${deployment.created_at}\nLast Updated: ${deployment.updated_at}`;
}

/**
 * List deployments for an app
 */
export async function listDeployments(appId: string, token: string): Promise<string> {
  const url = `${DO_API_BASE}/apps/${appId}/deployments`;
  
  const response = await makeDigitalOceanRequest<DeploymentListResponse>(url, 'GET', null, token);
  
  if (!response) {
    return "Failed to list deployments. Check your token and app ID.";
  }
  
  const deployments = response.deployments;
  
  if (deployments.length === 0) {
    return "No deployments found for this app.";
  }
  
  const formattedDeployments = deployments.map(d => 
    `ID: ${d.id}\nStatus: ${d.phase}\nCreated: ${d.created_at}`
  );
  
  return `Deployments for App ${appId}:\n\n${formattedDeployments.join('\n\n')}`;
}

/**
 * Create a new deployment (redeploy)
 */
export async function createDeployment(appId: string, forceBuild: boolean, token: string): Promise<string> {
  const url = `${DO_API_BASE}/apps/${appId}/deployments`;
  const body = forceBuild ? { force_build: true } : {};
  
  const response = await makeDigitalOceanRequest<{ deployment: DeploymentResponse }>(url, 'POST', body, token);
  
  if (!response) {
    return "Failed to create deployment. Check your token and app ID.";
  }
  
  const deployment = response.deployment;
  
  return `Deployment created successfully!\nDeployment ID: ${deployment.id}\nStatus: ${deployment.phase}\nCreated: ${deployment.created_at}`;
}

/**
 * Get deployment logs
 */
export async function getDeploymentLogs(appId: string, deploymentId: string, token: string): Promise<string> {
  const url = `${DO_API_BASE}/apps/${appId}/deployments/${deploymentId}/logs`;
  
  const response = await makeDigitalOceanRequest<LogResponse>(url, 'GET', null, token);
  
  if (!response) {
    return "Failed to get deployment logs. Check your token, app ID, and deployment ID.";
  }
  
  // Combine historic and live logs
  const allLogs = [...response.historic, ...response.live];
  
  if (allLogs.length === 0) {
    return "No logs found for this deployment.";
  }
  
  // Sort logs by timestamp
  allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const formattedLogs = allLogs.map(log => 
    `[${log.timestamp}] ${log.component_name}: ${log.message}`
  );
  
  return `Logs for Deployment ${deploymentId}:\n\n${formattedLogs.join('\n')}`;
}

/**
 * Delete an app
 */
export async function deleteApp(appId: string, token: string): Promise<string> {
  const url = `${DO_API_BASE}/apps/${appId}`;
  
  const response = await makeDigitalOceanRequest<{}>(url, 'DELETE', null, token);
  
  if (!response) {
    return "Failed to delete app. Check your token and app ID.";
  }
  
  return `App ${appId} deleted successfully.`;
} 