/**
 * Error handling utilities for AMANA frontend
 * Provides consistent error handling, logging, and user-friendly messages
 */

export type ErrorLevel = "info" | "warning" | "error" | "critical";

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  level: ErrorLevel;
  details?: unknown;
  timestamp: Date;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static maxLogSize = 50;

  /**
   * Parse various error types into a consistent AppError
   */
  static parse(error: unknown, context?: string): AppError {
    let code = "UNKNOWN_ERROR";
    let message = "An unknown error occurred";
    let userMessage = "Something went wrong. Please try again.";
    let level: ErrorLevel = "error";
    let details: unknown = null;

    if (error instanceof Error) {
      message = error.message;
      
      // Check for API errors
      if ("response" in error) {
        const apiError = error as any;
        const status = apiError.response?.status;
        const data = apiError.response?.data;
        
        code = `HTTP_${status}`;
        
        if (typeof data === "string") {
          userMessage = data;
        } else if (data?.detail) {
          userMessage = Array.isArray(data.detail) 
            ? data.detail.map((d: any) => d.msg).join(", ")
            : data.detail;
        }

        // Specific HTTP error handling
        if (status === 401) {
          code = "AUTH_FAILED";
          userMessage = "Please log in again";
          level = "warning";
        } else if (status === 403) {
          code = "FORBIDDEN";
          userMessage = "You don't have permission to do that";
          level = "warning";
        } else if (status === 404) {
          code = "NOT_FOUND";
          userMessage = "The requested resource was not found";
          level = "warning";
        } else if (status === 422) {
          code = "VALIDATION_ERROR";
          userMessage = "Please check your input and try again";
          level = "warning";
        } else if (status === 429) {
          code = "RATE_LIMITED";
          userMessage = "Too many requests. Please wait a moment and try again";
          level = "warning";
        } else if (status >= 500) {
          code = "SERVER_ERROR";
          userMessage = "Server error. Please try again later";
          level = "critical";
        }

        details = data;
      } else if (error.message.includes("Network")) {
        code = "NETWORK_ERROR";
        userMessage = "Network error. Please check your connection";
        level = "warning";
      } else if (error.message.includes("timeout")) {
        code = "TIMEOUT";
        userMessage = "Request timed out. Please try again";
        level = "warning";
      }
    } else if (typeof error === "string") {
      message = error;
      userMessage = error;
    } else if (typeof error === "object" && error !== null) {
      message = JSON.stringify(error);
      details = error;
    }

    const appError: AppError = {
      code,
      message,
      userMessage,
      level,
      details,
      timestamp: new Date(),
    };

    this.log(appError, context);
    return appError;
  }

  /**
   * Log error with context
   */
  static log(error: AppError, context?: string) {
    const logEntry = {
      ...error,
      context,
      timestamp: error.timestamp.toISOString(),
    };

    // Keep error log size bounded
    this.errorLog.push(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      const style = {
        error: "color: #ef4444; font-weight: bold;",
        warning: "color: #f59e0b; font-weight: bold;",
        info: "color: #3b82f6; font-weight: bold;",
        critical: "color: #dc2626; font-weight: bold; text-decoration: underline;",
      }[error.level];

      console.log(
        `%c[${error.level.toUpperCase()}] ${error.code}${context ? ` (${context})` : ""}`,
        style
      );
      console.log("Message:", error.message);
      if (error.details) console.log("Details:", error.details);
    }

    // Could send to error tracking service (Sentry, etc.)
    // sentryClient.captureException(error);
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: unknown): string {
    const appError = this.parse(error);
    return appError.userMessage;
  }

  /**
   * Get all logged errors
   */
  static getLogs(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearLogs() {
    this.errorLog = [];
  }

  /**
   * Export error log for debugging
   */
  static exportLogs(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }
}

/**
 * Safe async wrapper - prevents unhandled promise rejections
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    ErrorHandler.parse(error);
    return fallback;
  }
}

/**
 * Safe sync wrapper
 */
export function safeSync<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (error) {
    ErrorHandler.parse(error);
    return fallback;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}
