
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, foodTable } from '../db/schema';
import { type ConsumeInput } from '../schema';
import { consumeTarget } from '../handlers/consume_target';
import { eq, and } from 'drizzle-orm';

describe('consumeTarget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('consuming food', () => {
    it('should consume food and increase player mass', async () => {
      // Create a player
      await db.insert(playersTable).values({
        id: 'player1',
        name: 'Test Player',
        x: 100,
        y: 100,
        mass: 10,
        color: '#ff0000',
        is_alive: true
      }).execute();

      // Create food
      await db.insert(foodTable).values({
        id: 'food1',
        x: 105,
        y: 105,
        mass: 5,
        color: '#00ff00'
      }).execute();

      const input: ConsumeInput = {
        player_id: 'player1',
        target_id: 'food1',
        target_type: 'food'
      };

      const result = await consumeTarget(input);

      // Check player mass increased
      expect(result.id).toEqual('player1');
      expect(result.mass).toEqual(15); // 10 + 5
      expect(result.updated_at).toBeInstanceOf(Date);

      // Check food was deleted
      const remainingFood = await db.select()
        .from(foodTable)
        .where(eq(foodTable.id, 'food1'))
        .execute();
      
      expect(remainingFood).toHaveLength(0);
    });

    it('should throw error if food does not exist', async () => {
      // Create a player
      await db.insert(playersTable).values({
        id: 'player1',
        name: 'Test Player',
        x: 100,
        y: 100,
        mass: 10,
        color: '#ff0000',
        is_alive: true
      }).execute();

      const input: ConsumeInput = {
        player_id: 'player1',
        target_id: 'nonexistent',
        target_type: 'food'
      };

      await expect(consumeTarget(input)).rejects.toThrow(/food not found/i);
    });
  });

  describe('consuming players', () => {
    it('should consume smaller player and increase mass', async () => {
      // Create consumer player (larger)
      await db.insert(playersTable).values({
        id: 'player1',
        name: 'Big Player',
        x: 100,
        y: 100,
        mass: 20,
        color: '#ff0000',
        is_alive: true
      }).execute();

      // Create target player (smaller)
      await db.insert(playersTable).values({
        id: 'player2',
        name: 'Small Player',
        x: 105,
        y: 105,
        mass: 10,
        color: '#0000ff',
        is_alive: true
      }).execute();

      const input: ConsumeInput = {
        player_id: 'player1',
        target_id: 'player2',
        target_type: 'player'
      };

      const result = await consumeTarget(input);

      // Check consumer mass increased (gains 50% of target's mass)
      expect(result.id).toEqual('player1');
      expect(result.mass).toEqual(25); // 20 + (10 * 0.5)
      expect(result.updated_at).toBeInstanceOf(Date);

      // Check target player is marked as dead
      const targetPlayer = await db.select()
        .from(playersTable)
        .where(eq(playersTable.id, 'player2'))
        .execute();
      
      expect(targetPlayer).toHaveLength(1);
      expect(targetPlayer[0].is_alive).toBe(false);
      expect(targetPlayer[0].updated_at).toBeInstanceOf(Date);
    });

    it('should throw error if consumer is not larger than target', async () => {
      // Create consumer player (smaller)
      await db.insert(playersTable).values({
        id: 'player1',
        name: 'Small Player',
        x: 100,
        y: 100,
        mass: 10,
        color: '#ff0000',
        is_alive: true
      }).execute();

      // Create target player (larger)
      await db.insert(playersTable).values({
        id: 'player2',
        name: 'Big Player',
        x: 105,
        y: 105,
        mass: 20,
        color: '#0000ff',
        is_alive: true
      }).execute();

      const input: ConsumeInput = {
        player_id: 'player1',
        target_id: 'player2',
        target_type: 'player'
      };

      await expect(consumeTarget(input)).rejects.toThrow(/not large enough/i);
    });

    it('should throw error if target player does not exist', async () => {
      // Create consumer player
      await db.insert(playersTable).values({
        id: 'player1',
        name: 'Test Player',
        x: 100,
        y: 100,
        mass: 20,
        color: '#ff0000',
        is_alive: true
      }).execute();

      const input: ConsumeInput = {
        player_id: 'player1',
        target_id: 'nonexistent',
        target_type: 'player'
      };

      await expect(consumeTarget(input)).rejects.toThrow(/target player not found/i);
    });

    it('should throw error if target player is already dead', async () => {
      // Create consumer player
      await db.insert(playersTable).values({
        id: 'player1',
        name: 'Big Player',
        x: 100,
        y: 100,
        mass: 20,
        color: '#ff0000',
        is_alive: true
      }).execute();

      // Create dead target player
      await db.insert(playersTable).values({
        id: 'player2',
        name: 'Dead Player',
        x: 105,
        y: 105,
        mass: 10,
        color: '#0000ff',
        is_alive: false
      }).execute();

      const input: ConsumeInput = {
        player_id: 'player1',
        target_id: 'player2',
        target_type: 'player'
      };

      await expect(consumeTarget(input)).rejects.toThrow(/target player not found or not alive/i);
    });
  });

  describe('error cases', () => {
    it('should throw error if consuming player does not exist', async () => {
      // Create food
      await db.insert(foodTable).values({
        id: 'food1',
        x: 100,
        y: 100,
        mass: 5,
        color: '#00ff00'
      }).execute();

      const input: ConsumeInput = {
        player_id: 'nonexistent',
        target_id: 'food1',
        target_type: 'food'
      };

      await expect(consumeTarget(input)).rejects.toThrow(/player not found or not alive/i);
    });

    it('should throw error if consuming player is dead', async () => {
      // Create dead player
      await db.insert(playersTable).values({
        id: 'player1',
        name: 'Dead Player',
        x: 100,
        y: 100,
        mass: 10,
        color: '#ff0000',
        is_alive: false
      }).execute();

      // Create food
      await db.insert(foodTable).values({
        id: 'food1',
        x: 105,
        y: 105,
        mass: 5,
        color: '#00ff00'
      }).execute();

      const input: ConsumeInput = {
        player_id: 'player1',
        target_id: 'food1',
        target_type: 'food'
      };

      await expect(consumeTarget(input)).rejects.toThrow(/player not found or not alive/i);
    });
  });
});
