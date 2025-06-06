
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type Player } from '../schema';

export const getPlayers = async (): Promise<Player[]> => {
  try {
    const results = await db.select()
      .from(playersTable)
      .execute();

    // Convert real columns back to numbers for proper type handling
    return results.map(player => ({
      ...player,
      x: Number(player.x),
      y: Number(player.y),
      mass: Number(player.mass)
    }));
  } catch (error) {
    console.error('Get players failed:', error);
    throw error;
  }
};
