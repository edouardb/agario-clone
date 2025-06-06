
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { getPlayer } from '../handlers/get_player';

describe('getPlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a player when found', async () => {
    // Create a test player
    const testPlayer = {
      id: 'test-player-1',
      name: 'Test Player',
      x: 100,
      y: 200,
      mass: 25,
      color: '#ff0000',
      is_alive: true
    };

    await db.insert(playersTable)
      .values(testPlayer)
      .execute();

    const result = await getPlayer('test-player-1');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('test-player-1');
    expect(result!.name).toEqual('Test Player');
    expect(result!.x).toEqual(100);
    expect(result!.y).toEqual(200);
    expect(result!.mass).toEqual(25);
    expect(result!.color).toEqual('#ff0000');
    expect(result!.is_alive).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(typeof result!.x).toBe('number');
    expect(typeof result!.y).toBe('number');
    expect(typeof result!.mass).toBe('number');
  });

  it('should return null when player not found', async () => {
    const result = await getPlayer('non-existent-player');

    expect(result).toBeNull();
  });

  it('should handle numeric conversion correctly', async () => {
    // Create player with decimal values
    const testPlayer = {
      id: 'decimal-player',
      name: 'Decimal Player',
      x: 123.45,
      y: 678.90,
      mass: 42.75,
      color: '#00ff00',
      is_alive: true
    };

    await db.insert(playersTable)
      .values(testPlayer)
      .execute();

    const result = await getPlayer('decimal-player');

    expect(result).not.toBeNull();
    expect(result!.x).toEqual(123.45);
    expect(result!.y).toEqual(678.90);
    expect(result!.mass).toEqual(42.75);
    expect(typeof result!.x).toBe('number');
    expect(typeof result!.y).toBe('number');
    expect(typeof result!.mass).toBe('number');
  });
});
