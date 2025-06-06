
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameStateTable } from '../db/schema';
import { initializeGame } from '../handlers/initialize_game';
import { eq } from 'drizzle-orm';

describe('initializeGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create default game state', async () => {
    const result = await initializeGame();

    // Basic field validation
    expect(result.id).toEqual('default');
    expect(result.map_width).toEqual(2000);
    expect(result.map_height).toEqual(2000);
    expect(result.max_players).toEqual(50);
    expect(result.food_spawn_rate).toEqual(0.5);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.map_width).toBe('number');
    expect(typeof result.map_height).toBe('number');
    expect(typeof result.food_spawn_rate).toBe('number');
  });

  it('should save game state to database', async () => {
    const result = await initializeGame();

    // Query using proper drizzle syntax
    const gameStates = await db.select()
      .from(gameStateTable)
      .where(eq(gameStateTable.id, result.id))
      .execute();

    expect(gameStates).toHaveLength(1);
    expect(gameStates[0].id).toEqual('default');
    expect(Number(gameStates[0].map_width)).toEqual(2000);
    expect(Number(gameStates[0].map_height)).toEqual(2000);
    expect(gameStates[0].max_players).toEqual(50);
    expect(Number(gameStates[0].food_spawn_rate)).toEqual(0.5);
    expect(gameStates[0].created_at).toBeInstanceOf(Date);
    expect(gameStates[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate initialization gracefully', async () => {
    // First initialization should succeed
    await initializeGame();

    // Second initialization should fail due to unique primary key
    await expect(initializeGame()).rejects.toThrow(/duplicate key value/i);
  });
});
