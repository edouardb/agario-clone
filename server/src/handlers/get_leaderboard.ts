
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type LeaderboardEntry } from '../schema';
import { desc, sql } from 'drizzle-orm';

export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    // Query players ordered by mass descending, with rank calculation
    const results = await db
      .select({
        player_id: playersTable.id,
        player_name: playersTable.name,
        mass: playersTable.mass,
        rank: sql<string>`ROW_NUMBER() OVER (ORDER BY ${playersTable.mass} DESC)`.as('rank')
      })
      .from(playersTable)
      .orderBy(desc(playersTable.mass))
      .limit(limit)
      .execute();

    // Convert results to LeaderboardEntry objects
    return results.map(result => ({
      player_id: result.player_id,
      player_name: result.player_name,
      mass: result.mass,
      rank: parseInt(result.rank, 10)
    }));
  } catch (error) {
    console.error('Get leaderboard failed:', error);
    throw error;
  }
};
