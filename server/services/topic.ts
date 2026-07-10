/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeminiService } from "./gemini.js";
import { LoggerService } from "../logger.js";

const TAG = "TopicService";

export interface ExtractedTopics {
  themes: string[];
  keywords: string[];
  topics: string[]; // unified top topics
}

export class TopicService {
  /**
   * Extract event themes, keywords, and topics from description
   */
  static async extractTopics(description: string): Promise<ExtractedTopics> {
    LoggerService.info(TAG, `Extracting topics for description length: ${description.length}`);

    if (!description || description.trim() === "") {
      return { themes: [], keywords: [], topics: [] };
    }

    try {
      const prompt = `
You are acting as a DistilBERT NLP transformer model specialized in professional event theme extraction.
Analyze the following professional event description:
"${description}"

Perform the following tasks:
1. Extract the main overarching "themes" (2-4 broad industry categories).
2. Extract the key "keywords" (4-8 specific technical terms, technologies, or subjects).
3. Combine, deduplicate, and sort them to return the top 3-6 most relevant "topics".

Your response MUST be a valid JSON object only. Do NOT wrap it in any other text or markdown code blocks (such as \`\`\`json). The JSON must exactly match this schema:
{
  "themes": ["string"],
  "keywords": ["string"],
  "topics": ["string"]
}
`;

      const responseText = await GeminiService.generateText(prompt, "You are a professional NLP extraction service. Always return pure valid JSON matching the specified schema.");
      
      // Parse JSON from response
      const parsed = this.parseJsonFromResponse(responseText);
      
      // Clean and return
      return {
        themes: this.cleanArray(parsed.themes),
        keywords: this.cleanArray(parsed.keywords),
        topics: this.cleanArray(parsed.topics),
      };
    } catch (err) {
      LoggerService.error(TAG, "Failed to extract topics using AI, falling back to local heuristic extraction", err);
      return this.localFallbackExtraction(description);
    }
  }

  private static parseJsonFromResponse(text: string): any {
    try {
      // Strip out markdown formatting if any exists
      let cleanText = text.trim();
      if (cleanText.includes("```")) {
        const matches = cleanText.match(/```(?:json)?([\s\S]*?)```/);
        if (matches && matches[1]) {
          cleanText = matches[1].trim();
        }
      }
      return JSON.parse(cleanText);
    } catch (err) {
      LoggerService.warn(TAG, "Failed to parse JSON directly, attempting relaxed match", err);
      
      // Attempt relaxed match with regex
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (relaxedErr) {
        LoggerService.error(TAG, "Relaxed JSON parse also failed");
      }
      throw new Error("Invalid JSON response from AI theme extraction");
    }
  }

  private static cleanArray(arr: any): string[] {
    if (!Array.isArray(arr)) return [];
    return Array.from(new Set(
      arr
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
    ));
  }

  /**
   * Simple TF-IDF/heuristic keyword extraction fallback to guarantee 100% service uptime
   */
  private static localFallbackExtraction(text: string): ExtractedTopics {
    LoggerService.info(TAG, "Running local heuristic keyword extractor fallback");
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4); // Filter out short words/stop-words roughly

    const stopwords = new Set([
      "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent",
      "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
      "cant", "cannot", "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont",
      "down", "during", "each", "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have",
      "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him",
      "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt",
      "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not",
      "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
      "over", "own", "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some",
      "such", "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there",
      "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to",
      "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were", "weve", "werent",
      "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why",
      "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours",
      "yourself", "yourselves", "event", "meeting", "conference", "workshop", "summit", "presentation", "discussion"
    ]);

    const freqMap: Record<string, number> = {};
    for (const word of words) {
      if (!stopwords.has(word)) {
        freqMap[word] = (freqMap[word] || 0) + 1;
      }
    }

    const sortedKeywords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
      .slice(0, 8);

    // Derive mock themes and topics
    const themes = sortedKeywords.slice(0, 2).map((w) => `${w} Technology`);
    const topics = Array.from(new Set([...themes, ...sortedKeywords.slice(2, 5)]));

    return {
      themes,
      keywords: sortedKeywords,
      topics,
    };
  }
}
