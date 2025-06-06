
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type Player } from '../schema';
import { eq } from 'drizzle-orm';

export const getPlayer = async (id: string): Promise<Player | null> => {
  try {
    const results = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const player = results[0];
    return {
      ...player,
      x: parseFloat(player.x.toString()),
      y: parseFloat(player.y.toString()),
      mass: parseFloat(player.mass.toString())
    };
  } catch (error) {
    console.error('Get player failed:', error);
    throw error;
  }
};
