
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

  it('should return existing game state on subsequent calls', async () => {
    // First initialization should succeed
    const firstResult = await initializeGame();

    // Second initialization should return the same existing state
    const secondResult = await initializeGame();

    // Both should be identical
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.map_width).toEqual(firstResult.map_width);
    expect(secondResult.map_height).toEqual(firstResult.map_height);
    expect(secondResult.max_players).toEqual(firstResult.max_players);
    expect(secondResult.food_spawn_rate).toEqual(firstResult.food_spawn_rate);
    expect(secondResult.created_at).toEqual(firstResult.created_at);
    expect(secondResult.updated_at).toEqual(firstResult.updated_at);

    // Verify numeric types on second call
    expect(typeof secondResult.map_width).toBe('number');
    expect(typeof secondResult.map_height).toBe('number');
    expect(typeof secondResult.food_spawn_rate).toBe('number');

    // Verify only one record exists in database
    const gameStates = await db.select()
      .from(gameStateTable)
      .where(eq(gameStateTable.id, 'default'))
      .execute();

    expect(gameStates).toHaveLength(1);
  });
});
