
import { db } from '../db';
import { gameStateTable } from '../db/schema';
import { type GameState } from '../schema';

export const initializeGame = async (): Promise<GameState> => {
  try {
    // Insert default game state record
    const result = await db.insert(gameStateTable)
      .values({
        id: 'default',
        map_width: 2000,
        map_height: 2000,
        max_players: 50,
        food_spawn_rate: 0.5
      })
      .returning()
      .execute();

    // Convert real fields back to numbers before returning
    const gameState = result[0];
    return {
      ...gameState,
      map_width: Number(gameState.map_width),
      map_height: Number(gameState.map_height),
      food_spawn_rate: Number(gameState.food_spawn_rate)
    };
  } catch (error) {
    console.error('Game initialization failed:', error);
    throw error;
  }
};
