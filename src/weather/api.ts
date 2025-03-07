import { makeApiRequest } from '../shared/api.js';
import { AlertFeature, AlertsResponse, ForecastPeriod, ForecastResponse, PointsResponse } from './types.js';

export const NWS_API_BASE = "https://api.weather.gov";
export const WEATHER_USER_AGENT = "weather-app/1.0";

/**
 * Make a request to the National Weather Service API
 */
export async function makeNWSRequest<T>(url: string): Promise<T | null> {
  return makeApiRequest<T>(url, WEATHER_USER_AGENT);
}

/**
 * Format alert data
 */
export function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}

/**
 * Get alerts for a state
 */
export async function getAlertsForState(stateCode: string): Promise<string> {
  const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
  const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

  if (!alertsData) {
    return "Failed to retrieve alerts data";
  }

  const features = alertsData.features || [];
  if (features.length === 0) {
    return `No active alerts for ${stateCode}`;
  }

  const formattedAlerts = features.map(formatAlert);
  return `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;
}

/**
 * Get forecast for coordinates
 */
export async function getForecastForLocation(latitude: number, longitude: number): Promise<string> {
  // Get grid point data
  const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

  if (!pointsData) {
    return `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`;
  }

  const forecastUrl = pointsData.properties?.forecast;
  if (!forecastUrl) {
    return "Failed to get forecast URL from grid point data";
  }

  // Get forecast data
  const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
  if (!forecastData) {
    return "Failed to retrieve forecast data";
  }

  const periods = forecastData.properties?.periods || [];
  if (periods.length === 0) {
    return "No forecast periods available";
  }

  // Format forecast periods
  const formattedForecast = periods.map((period: ForecastPeriod) =>
    [
      `${period.name || "Unknown"}:`,
      `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
      `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
      `${period.shortForecast || "No forecast available"}`,
      "---",
    ].join("\n"),
  );

  return `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;
} 