import { makeApiRequest } from '../shared/api.js';
import { ExampleResponse } from './types.js';

export const API_BASE = "https://api.example.com";
export const USER_AGENT = "example-app/1.0";

/**
 * Make a request to the example API
 */
export async function makeExampleRequest<T>(url: string): Promise<T | null> {
  return makeApiRequest<T>(url, USER_AGENT);
}

/**
 * Example function to get data from the API
 * Replace this with your own functions for the new API
 */
export async function getExampleData(param: string): Promise<string> {
  const url = `${API_BASE}/endpoint?param=${encodeURIComponent(param)}`;
  const data = await makeExampleRequest<ExampleResponse>(url);

  if (!data) {
    return "Failed to retrieve data";
  }

  // Process the data and return a formatted string
  return `Example data for ${param}:\n\n${JSON.stringify(data, null, 2)}`;
} 