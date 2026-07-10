/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { LoggerService } from "../logger.js";

const TAG = "GeminiService";

export class GeminiService {
  private static client: GoogleGenAI | null = null;

  static getClient(): GoogleGenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      LoggerService.warn(TAG, "GEMINI_API_KEY is not defined in the environment. Falling back to dummy mode.");
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }

    LoggerService.info(TAG, "Initializing GoogleGenAI client");
    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    return this.client;
  }

  static async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const ai = this.getClient();
    LoggerService.info(TAG, `Calling Gemini API with prompt length ${prompt.length}`);
    LoggerService.debug(TAG, `Prompt contents: ${prompt}`);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      if (!response || !response.text) {
        throw new Error("Received an empty response from Gemini API");
      }

      LoggerService.info(TAG, "Gemini API call completed successfully");
      return response.text;
    } catch (err: any) {
      LoggerService.error(TAG, "Gemini API error", err);
      throw err;
    }
  }
}
