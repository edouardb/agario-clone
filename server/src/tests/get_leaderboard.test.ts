
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { getLeaderboard } from '../handlers/get_leaderboard';
import { nanoid } from 'nanoid';

describe('getLeaderboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty leaderboard when no players exist', async () => {
    const result = await getLeaderboard();

    expect(result).toEqual([]);
  });

  it('should return players ordered by mass descending with correct ranks', async () => {
    // Create test players with different masses
    const player1Id = nanoid();
    const player2Id = nanoid();
    const player3Id = nanoid();

    await db.insert(playersTable).values([
      {
        id: player1Id,
        name: 'Player 1',
        x: 100,
        y: 100,
        mass: 50,
        color: '#ff0000'
      },
      {
        id: player2Id,
        name: 'Player 2',
        x: 200,
        y: 200,
        mass: 100,
        color: '#00ff00'
      },
      {
        id: player3Id,
        name: 'Player 3',
        x: 300,
        y: 300,
        mass: 25,
        color: '#0000ff'
      }
    ]).execute();

    const result = await getLeaderboard();

    expect(result).toHaveLength(3);
    
    // Check ordering by mass (descending)
    expect(result[0].player_id).toBe(player2Id);
    expect(result[0].player_name).toBe('Player 2');
    expect(result[0].mass).toBe(100);
    expect(result[0].rank).toBe(1);

    expect(result[1].player_id).toBe(player1Id);
    expect(result[1].player_name).toBe('Player 1');
    expect(result[1].mass).toBe(50);
    expect(result[1].rank).toBe(2);

    expect(result[2].player_id).toBe(player3Id);
    expect(result[2].player_name).toBe('Player 3');
    expect(result[2].mass).toBe(25);
    expect(result[2].rank).toBe(3);
  });

  it('should respect limit parameter', async () => {
    // Create 5 test players
    const players = Array.from({ length: 5 }, (_, i) => ({
      id: nanoid(),
      name: `Player ${i + 1}`,
      x: 100 + i * 50,
      y: 100 + i * 50,
      mass: 10 + i * 10,
      color: `#${i.toString().repeat(6)}`
    }));

    await db.insert(playersTable).values(players).execute();

    const result = await getLeaderboard(3);

    expect(result).toHaveLength(3);
    
    // Should return top 3 players by mass
    expect(result[0].mass).toBe(50); // Player 5
    expect(result[1].mass).toBe(40); // Player 4
    expect(result[2].mass).toBe(30); // Player 3
  });

  it('should handle players with same mass correctly', async () => {
    // Create players with same mass
    const player1Id = nanoid();
    const player2Id = nanoid();

    await db.insert(playersTable).values([
      {
        id: player1Id,
        name: 'Player A',
        x: 100,
        y: 100,
        mass: 50,
        color: '#ff0000'
      },
      {
        id: player2Id,
        name: 'Player B',
        x: 200,
        y: 200,
        mass: 50,
        color: '#00ff00'
      }
    ]).execute();

    const result = await getLeaderboard();

    expect(result).toHaveLength(2);
    expect(result[0].mass).toBe(50);
    expect(result[1].mass).toBe(50);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it('should use default limit of 10 when no limit specified', async () => {
    // Create 15 test players
    const players = Array.from({ length: 15 }, (_, i) => ({
      id: nanoid(),
      name: `Player ${i + 1}`,
      x: 100 + i * 10,
      y: 100 + i * 10,
      mass: 10 + i,
      color: `#${i.toString(16).padStart(6, '0')}`
    }));

    await db.insert(playersTable).values(players).execute();

    const result = await getLeaderboard();

    expect(result).toHaveLength(10);
    
    // Verify ranks are sequential from 1 to 10
    result.forEach((entry, index) => {
      expect(entry.rank).toBe(index + 1);
    });
  });
});
