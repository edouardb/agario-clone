
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreatePlayerInput } from '../schema';
import { createPlayer } from '../handlers/create_player';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithPosition: CreatePlayerInput = {
  name: 'TestPlayer',
  x: 100,
  y: 200
};

const testInputWithoutPosition: CreatePlayerInput = {
  name: 'RandomPlayer'
};

describe('createPlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a player with specified position', async () => {
    const result = await createPlayer(testInputWithPosition);

    // Basic field validation
    expect(result.name).toEqual('TestPlayer');
    expect(result.x).toEqual(100);
    expect(result.y).toEqual(200);
    expect(result.mass).toEqual(10);
    expect(result.is_alive).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.color).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
    expect(typeof result.mass).toBe('number');
  });

  it('should create a player with random position when not specified', async () => {
    const result = await createPlayer(testInputWithoutPosition);

    expect(result.name).toEqual('RandomPlayer');
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.x).toBeLessThanOrEqual(2000);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeLessThanOrEqual(2000);
    expect(result.mass).toEqual(10);
    expect(result.is_alive).toBe(true);
  });

  it('should save player to database', async () => {
    const result = await createPlayer(testInputWithPosition);

    // Query using proper drizzle syntax
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result.id))
      .execute();

    expect(players).toHaveLength(1);
    const savedPlayer = players[0];
    expect(savedPlayer.name).toEqual('TestPlayer');
    expect(Number(savedPlayer.x)).toEqual(100);
    expect(Number(savedPlayer.y)).toEqual(200);
    expect(Number(savedPlayer.mass)).toEqual(10);
    expect(savedPlayer.is_alive).toBe(true);
    expect(savedPlayer.created_at).toBeInstanceOf(Date);
    expect(savedPlayer.updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique player IDs', async () => {
    const player1 = await createPlayer({ name: 'Player1' });
    const player2 = await createPlayer({ name: 'Player2' });

    expect(player1.id).not.toEqual(player2.id);
    expect(player1.id).toMatch(/^player_\d+_[a-z0-9]+$/);
    expect(player2.id).toMatch(/^player_\d+_[a-z0-9]+$/);
  });

  it('should assign random colors to players', async () => {
    const player1 = await createPlayer({ name: 'Player1' });
    const player2 = await createPlayer({ name: 'Player2' });

    expect(player1.color).toMatch(/^#[A-F0-9]{6}$/i);
    expect(player2.color).toMatch(/^#[A-F0-9]{6}$/i);
    // Colors might be the same (random), but format should be valid
  });

  it('should handle players with same name', async () => {
    const player1 = await createPlayer({ name: 'SameName' });
    const player2 = await createPlayer({ name: 'SameName' });

    expect(player1.name).toEqual('SameName');
    expect(player2.name).toEqual('SameName');
    expect(player1.id).not.toEqual(player2.id);

    // Both should exist in database
    const allPlayers = await db.select()
      .from(playersTable)
      .execute();

    expect(allPlayers).toHaveLength(2);
  });
});
