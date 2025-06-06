
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdatePlayerPositionInput } from '../schema';
import { updatePlayerPosition } from '../handlers/update_player_position';
import { eq } from 'drizzle-orm';

describe('updatePlayerPosition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update player position', async () => {
    // Create a test player first
    const testPlayer = await db.insert(playersTable)
      .values({
        id: 'test-player-1',
        name: 'Test Player',
        x: 100,
        y: 100,
        mass: 10,
        color: '#ff0000',
        is_alive: true
      })
      .returning()
      .execute();

    const input: UpdatePlayerPositionInput = {
      id: 'test-player-1',
      x: 200,
      y: 300
    };

    const result = await updatePlayerPosition(input);

    // Verify position was updated
    expect(result.id).toEqual('test-player-1');
    expect(result.x).toEqual(200);
    expect(result.y).toEqual(300);
    expect(result.name).toEqual('Test Player');
    expect(result.mass).toEqual(10);
    expect(result.color).toEqual('#ff0000');
    expect(result.is_alive).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at is more recent than created_at
    expect(result.updated_at.getTime()).toBeGreaterThan(testPlayer[0].created_at.getTime());
  });

  it('should save updated position to database', async () => {
    // Create a test player first
    await db.insert(playersTable)
      .values({
        id: 'test-player-2',
        name: 'Test Player 2',
        x: 50,
        y: 75,
        mass: 15,
        color: '#00ff00',
        is_alive: true
      })
      .execute();

    const input: UpdatePlayerPositionInput = {
      id: 'test-player-2',
      x: 150,
      y: 250
    };

    await updatePlayerPosition(input);

    // Query database to verify update
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, 'test-player-2'))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].x).toEqual(150);
    expect(players[0].y).toEqual(250);
    expect(players[0].name).toEqual('Test Player 2');
    expect(players[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when player not found', async () => {
    const input: UpdatePlayerPositionInput = {
      id: 'non-existent-player',
      x: 100,
      y: 200
    };

    await expect(updatePlayerPosition(input)).rejects.toThrow(/Player with id non-existent-player not found/i);
  });

  it('should handle negative coordinates', async () => {
    // Create a test player first
    await db.insert(playersTable)
      .values({
        id: 'test-player-3',
        name: 'Test Player 3',
        x: 0,
        y: 0,
        mass: 20,
        color: '#0000ff',
        is_alive: true
      })
      .execute();

    const input: UpdatePlayerPositionInput = {
      id: 'test-player-3',
      x: -50,
      y: -75
    };

    const result = await updatePlayerPosition(input);

    expect(result.x).toEqual(-50);
    expect(result.y).toEqual(-75);
    expect(result.id).toEqual('test-player-3');
  });

  it('should handle floating point coordinates', async () => {
    // Create a test player first
    await db.insert(playersTable)
      .values({
        id: 'test-player-4',
        name: 'Test Player 4',
        x: 10.5,
        y: 20.7,
        mass: 12.3,
        color: '#ffff00',
        is_alive: true
      })
      .execute();

    const input: UpdatePlayerPositionInput = {
      id: 'test-player-4',
      x: 123.45,
      y: 678.90
    };

    const result = await updatePlayerPosition(input);

    expect(result.x).toBeCloseTo(123.45);
    expect(result.y).toBeCloseTo(678.90);
    expect(result.id).toEqual('test-player-4');
  });
});
