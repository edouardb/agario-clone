
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { getPlayers } from '../handlers/get_players';

describe('getPlayers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no players exist', async () => {
    const result = await getPlayers();
    
    expect(result).toEqual([]);
  });

  it('should return all players', async () => {
    // Create test players
    await db.insert(playersTable)
      .values([
        {
          id: 'player1',
          name: 'Alice',
          x: 100.5,
          y: 200.3,
          mass: 15.7,
          color: '#ff0000',
          is_alive: true
        },
        {
          id: 'player2',
          name: 'Bob',
          x: 300.1,
          y: 150.9,
          mass: 25.2,
          color: '#00ff00',
          is_alive: false
        }
      ])
      .execute();

    const result = await getPlayers();

    expect(result).toHaveLength(2);
    
    // Check first player
    const alice = result.find(p => p.name === 'Alice');
    expect(alice).toBeDefined();
    expect(alice!.id).toEqual('player1');
    expect(alice!.x).toEqual(100.5);
    expect(alice!.y).toEqual(200.3);
    expect(alice!.mass).toEqual(15.7);
    expect(alice!.color).toEqual('#ff0000');
    expect(alice!.is_alive).toBe(true);
    expect(alice!.created_at).toBeInstanceOf(Date);
    expect(alice!.updated_at).toBeInstanceOf(Date);

    // Check second player
    const bob = result.find(p => p.name === 'Bob');
    expect(bob).toBeDefined();
    expect(bob!.id).toEqual('player2');
    expect(bob!.x).toEqual(300.1);
    expect(bob!.y).toEqual(150.9);
    expect(bob!.mass).toEqual(25.2);
    expect(bob!.color).toEqual('#00ff00');
    expect(bob!.is_alive).toBe(false);
  });

  it('should return numeric types for real columns', async () => {
    await db.insert(playersTable)
      .values({
        id: 'test-player',
        name: 'Test Player',
        x: 123.456,
        y: 789.123,
        mass: 50.75,
        color: '#0000ff',
        is_alive: true
      })
      .execute();

    const result = await getPlayers();

    expect(result).toHaveLength(1);
    const player = result[0];
    
    // Verify numeric types
    expect(typeof player.x).toBe('number');
    expect(typeof player.y).toBe('number');
    expect(typeof player.mass).toBe('number');
    expect(player.x).toEqual(123.456);
    expect(player.y).toEqual(789.123);
    expect(player.mass).toEqual(50.75);
  });
});
