
import { db } from '../db';
import { playersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePlayer = async (id: string): Promise<void> => {
  try {
    await db.delete(playersTable)
      .where(eq(playersTable.id, id))
      .execute();
  } catch (error) {
    console.error('Player deletion failed:', error);
    throw error;
  }
};
