// src/utils/errorHandler.ts
import { message } from "antd";

export class GameError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "GameError";
  }
}

export function handleError(error: unknown, context?: string) {
  console.error(`Error in ${context || "unknown context"}:`, error);

  if (error instanceof GameError) {
    message.error(error.message);
  } else if (error instanceof Error) {
    message.error(`发生错误: ${error.message}`);
  } else {
    message.error("发生未知错误");
  }
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => handleError(error, context));
      }
      return result;
    } catch (error) {
      handleError(error, context);
    }
  }) as T;
}
