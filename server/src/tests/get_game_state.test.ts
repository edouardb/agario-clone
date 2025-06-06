
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameStateTable } from '../db/schema';
import { getGameState } from '../handlers/get_game_state';

describe('getGameState', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should throw error when no game state exists', async () => {
    await expect(getGameState()).rejects.toThrow(/no game state found/i);
  });

  it('should return game state with correct data types', async () => {
    // Create a game state record
    await db.insert(gameStateTable)
      .values({
        id: 'game-1',
        map_width: 1500,
        map_height: 1200,
        max_players: 100,
        food_spawn_rate: 0.8
      })
      .execute();

    const result = await getGameState();

    expect(result.id).toEqual('game-1');
    expect(result.map_width).toEqual(1500);
    expect(result.map_height).toEqual(1200);
    expect(result.max_players).toEqual(100);
    expect(result.food_spawn_rate).toEqual(0.8);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are correctly converted
    expect(typeof result.map_width).toEqual('number');
    expect(typeof result.map_height).toEqual('number');
    expect(typeof result.max_players).toEqual('number');
    expect(typeof result.food_spawn_rate).toEqual('number');
  });

  it('should return first game state when multiple exist', async () => {
    // Create multiple game state records
    await db.insert(gameStateTable)
      .values([
        {
          id: 'game-1',
          map_width: 1500,
          map_height: 1200,
          max_players: 100,
          food_spawn_rate: 0.8
        },
        {
          id: 'game-2',
          map_width: 2500,
          map_height: 2200,
          max_players: 200,
          food_spawn_rate: 1.2
        }
      ])
      .execute();

    const result = await getGameState();

    // Should return the first record (database order)
    expect(result.id).toBeDefined();
    expect(typeof result.map_width).toEqual('number');
    expect(typeof result.map_height).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle default values correctly', async () => {
    // Create game state with minimal data to test defaults
    await db.insert(gameStateTable)
      .values({
        id: 'game-minimal'
        // Let other fields use their defaults
      })
      .execute();

    const result = await getGameState();

    expect(result.id).toEqual('game-minimal');
    expect(result.map_width).toEqual(2000); // default value
    expect(result.map_height).toEqual(2000); // default value
    expect(result.max_players).toEqual(50); // default value
    expect(result.food_spawn_rate).toEqual(0.5); // default value
  });
});
