/**
 * Utility function for making API requests
 */
export async function makeApiRequest<T>(url: string, userAgent: string): Promise<T | null> {
  const headers = {
    "User-Agent": userAgent,
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making API request:", error);
    return null;
  }
} 