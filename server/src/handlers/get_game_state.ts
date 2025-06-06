
import { db } from '../db';
import { gameStateTable } from '../db/schema';
import { type GameState } from '../schema';

export const getGameState = async (): Promise<GameState> => {
  try {
    // Get the first (and likely only) game state record
    const result = await db.select()
      .from(gameStateTable)
      .limit(1)
      .execute();

    if (result.length === 0) {
      throw new Error('No game state found');
    }

    const gameState = result[0];
    
    // Convert numeric fields back to numbers
    return {
      ...gameState,
      map_width: Number(gameState.map_width),
      map_height: Number(gameState.map_height),
      food_spawn_rate: Number(gameState.food_spawn_rate)
    };
  } catch (error) {
    console.error('Get game state failed:', error);
    throw error;
  }
};
