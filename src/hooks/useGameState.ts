// src/hooks/useGameState.ts
import { useReducer, useCallback } from "react";
import { GameState, Player } from "../types";
import { createInitialGameState, handlePlacePiece } from "../gameLogic";

type GameAction =
  | { type: "RESET_GAME" }
  | { type: "PLACE_PIECE"; payload: { row: number; col: number } }
  | { type: "UPDATE_GAME_STATE"; payload: GameState }
  | { type: "SET_GAME_OVER"; payload: { winner: Player | null } };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET_GAME":
      return createInitialGameState();
    case "PLACE_PIECE":
      return handlePlacePiece(state, action.payload.row, action.payload.col);
    case "UPDATE_GAME_STATE":
      return action.payload;
    case "SET_GAME_OVER":
      return { ...state, isGameOver: true, winner: action.payload.winner };
    default:
      return state;
  }
}

export function useGameState() {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    createInitialGameState()
  );

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  const placePiece = useCallback((row: number, col: number) => {
    dispatch({ type: "PLACE_PIECE", payload: { row, col } });
  }, []);

  const updateGameState = useCallback((newState: GameState) => {
    dispatch({ type: "UPDATE_GAME_STATE", payload: newState });
  }, []);

  const setGameOver = useCallback((winner: Player | null) => {
    dispatch({ type: "SET_GAME_OVER", payload: { winner } });
  }, []);

  return {
    gameState,
    resetGame,
    placePiece,
    updateGameState,
    setGameOver,
  };
}
