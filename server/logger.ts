/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class LoggerService {
  private static isDebug = process.env.DEBUG !== "false";

  static log(level: "INFO" | "DEBUG" | "WARN" | "ERROR", category: string, message: string, meta?: any) {
    if (level === "DEBUG" && !this.isDebug) return;

    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
    const logLine = `[${timestamp}] [${level}] [${category}] ${message}${metaStr}`;

    if (level === "ERROR") {
      console.error(logLine);
    } else if (level === "WARN") {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  }

  static info(category: string, message: string, meta?: any) {
    this.log("INFO", category, message, meta);
  }

  static debug(category: string, message: string, meta?: any) {
    this.log("DEBUG", category, message, meta);
  }

  static warn(category: string, message: string, meta?: any) {
    this.log("WARN", category, message, meta);
  }

  static error(category: string, message: string, meta?: any) {
    this.log("ERROR", category, message, meta);
  }
}
