
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deletePlayer } from '../handlers/delete_player';

describe('deletePlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a player', async () => {
    // Create a test player first
    const testPlayer = {
      id: 'test-player-1',
      name: 'Test Player',
      x: 100,
      y: 200,
      mass: 15,
      color: '#ff0000',
      is_alive: true
    };

    await db.insert(playersTable)
      .values(testPlayer)
      .execute();

    // Verify player exists
    const playersBefore = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, testPlayer.id))
      .execute();

    expect(playersBefore).toHaveLength(1);

    // Delete the player
    await deletePlayer(testPlayer.id);

    // Verify player is deleted
    const playersAfter = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, testPlayer.id))
      .execute();

    expect(playersAfter).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent player', async () => {
    // Deleting a non-existent player should not throw an error
    await expect(deletePlayer('non-existent-id')).resolves.toBeUndefined();
  });

  it('should delete only the specified player', async () => {
    // Create multiple test players
    const testPlayers = [
      {
        id: 'player-1',
        name: 'Player One',
        x: 100,
        y: 100,
        mass: 10,
        color: '#ff0000',
        is_alive: true
      },
      {
        id: 'player-2',
        name: 'Player Two',
        x: 200,
        y: 200,
        mass: 12,
        color: '#00ff00',
        is_alive: true
      }
    ];

    for (const player of testPlayers) {
      await db.insert(playersTable)
        .values(player)
        .execute();
    }

    // Delete only the first player
    await deletePlayer('player-1');

    // Verify first player is deleted
    const deletedPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, 'player-1'))
      .execute();

    expect(deletedPlayer).toHaveLength(0);

    // Verify second player still exists
    const remainingPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, 'player-2'))
      .execute();

    expect(remainingPlayer).toHaveLength(1);
    expect(remainingPlayer[0].name).toEqual('Player Two');
  });
});
