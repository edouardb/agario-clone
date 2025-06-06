
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdatePlayerPositionInput, type Player } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePlayerPosition = async (input: UpdatePlayerPositionInput): Promise<Player> => {
  try {
    // Update player position and updated_at timestamp
    const result = await db.update(playersTable)
      .set({
        x: input.x,
        y: input.y,
        updated_at: new Date()
      })
      .where(eq(playersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Player with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Player position update failed:', error);
    throw error;
  }
};
