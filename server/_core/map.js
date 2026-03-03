/**
 * Google Maps API Integration
 *
 * Main function: makeRequest(endpoint, params) - Makes authenticated requests to Google Maps APIs
 * All credentials are automatically injected. Array parameters use | as separator.
 */
import { ENV } from "./env.js";

function getMapsConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Google Maps proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
  };
}

/**
 * Make authenticated requests to Google Maps APIs
 *
 * @param {string} endpoint - The API endpoint (e.g., "/maps/api/geocode/json")
 * @param {Record<string, unknown>} params - Query parameters for the request
 * @param {Object} [options] - Additional request options
 * @returns {Promise<unknown>} The API response
 */
export async function makeRequest(endpoint, params = {}, options = {}) {
  const { baseUrl, apiKey } = getMapsConfig();

  // Construct full URL: baseUrl + /v1/maps/proxy + endpoint
  const url = new URL(`${baseUrl}/v1/maps/proxy${endpoint}`);

  // Add API key as query parameter (standard Google Maps API authentication)
  url.searchParams.append("key", apiKey);

  // Add other query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  return await response.json();
}
