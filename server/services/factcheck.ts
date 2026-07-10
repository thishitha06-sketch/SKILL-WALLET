/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoggerService } from "../logger.js";

const TAG = "FactCheckService";

export interface FactCheckResult {
  title: string;
  summary: string;
  url: string;
  found: boolean;
}

export class FactCheckService {
  /**
   * Search Wikipedia and return summary details
   */
  static async queryWikipedia(query: string): Promise<FactCheckResult> {
    LoggerService.info(TAG, `Querying Wikipedia for: "${query}"`);

    if (!query || query.trim() === "") {
      return {
        title: "",
        summary: "Please provide a valid query to search.",
        url: "",
        found: false,
      };
    }

    try {
      // Step 1: Search Wikipedia for the closest matching page title
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&origin=*`;

      LoggerService.debug(TAG, `Wikipedia Search URL: ${searchUrl}`);
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia Search API returned HTTP ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const searchResults = searchData?.query?.search;

      if (!searchResults || searchResults.length === 0) {
        LoggerService.info(TAG, `No Wikipedia search results for query: "${query}"`);
        return {
          title: query,
          summary: `No Wikipedia article found directly matching "${query}". Try refining your search query with more specific terms.`,
          url: "",
          found: false,
        };
      }

      // Best match title
      const bestMatchTitle = searchResults[0].title;
      LoggerService.info(TAG, `Best matching article title found: "${bestMatchTitle}"`);

      // Step 2: Fetch summary for the best matching article
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        bestMatchTitle.replace(/ /g, "_")
      )}`;

      LoggerService.debug(TAG, `Wikipedia Summary URL: ${summaryUrl}`);
      const summaryResponse = await fetch(summaryUrl);
      if (!summaryResponse.ok) {
        if (summaryResponse.status === 404) {
          // Fallback to standard snippet if summary page doesn't exist
          return {
            title: bestMatchTitle,
            summary: searchResults[0].snippet.replace(/<span class="searchmatch">|<\/span>/g, "") + "...",
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(bestMatchTitle.replace(/ /g, "_"))}`,
            found: true,
          };
        }
        throw new Error(`Wikipedia Summary API returned HTTP ${summaryResponse.status}`);
      }

      const summaryData = await summaryResponse.json();

      return {
        title: summaryData.title || bestMatchTitle,
        summary: summaryData.extract || "No article extract available.",
        url: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(bestMatchTitle.replace(/ /g, "_"))}`,
        found: true,
      };
    } catch (err: any) {
      LoggerService.error(TAG, "Error in Wikipedia fact check operation", err);
      return {
        title: query,
        summary: `Unable to verify "${query}" at this time due to an external service disruption. Error: ${err.message}`,
        url: "",
        found: false,
      };
    }
  }
}
