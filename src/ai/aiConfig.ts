// src/ai/aiConfig.ts
import { AI_DIFFICULTY } from "../constants/gameConfig";

export interface AIConfig {
  searchDepth: number;
  thinkingTime: number;
  randomness: number; // 0-1, 0为完全理性，1为完全随机
  aggressiveness: number; // 0-1, 0为完全防守，1为完全进攻
}

export const AI_CONFIGS: Record<string, AIConfig> = {
  [AI_DIFFICULTY.EASY]: {
    searchDepth: 1,
    thinkingTime: 300,
    randomness: 0.3,
    aggressiveness: 0.4,
  },
  [AI_DIFFICULTY.MEDIUM]: {
    searchDepth: 2,
    thinkingTime: 500,
    randomness: 0.1,
    aggressiveness: 0.6,
  },
  [AI_DIFFICULTY.HARD]: {
    searchDepth: 3,
    thinkingTime: 800,
    randomness: 0.05,
    aggressiveness: 0.8,
  },
};

export function getAIConfig(difficulty: string): AIConfig {
  return AI_CONFIGS[difficulty] || AI_CONFIGS[AI_DIFFICULTY.MEDIUM];
}
