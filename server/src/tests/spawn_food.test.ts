
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodTable } from '../db/schema';
import { type SpawnFoodInput } from '../schema';
import { spawnFood } from '../handlers/spawn_food';
import { eq } from 'drizzle-orm';

describe('spawnFood', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should spawn a single food particle by default', async () => {
    const input: SpawnFoodInput = { count: 1 };
    const result = await spawnFood(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].x).toBeGreaterThanOrEqual(0);
    expect(result[0].x).toBeLessThanOrEqual(2000);
    expect(result[0].y).toBeGreaterThanOrEqual(0);
    expect(result[0].y).toBeLessThanOrEqual(2000);
    expect(result[0].mass).toEqual(1);
    expect(result[0].color).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should spawn multiple food particles', async () => {
    const input: SpawnFoodInput = { count: 5 };
    const result = await spawnFood(input);

    expect(result).toHaveLength(5);
    
    // Verify each food particle has unique properties
    const ids = result.map(food => food.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(5); // All IDs should be unique
    
    // Verify all particles have valid properties
    result.forEach(food => {
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThanOrEqual(2000);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThanOrEqual(2000);
      expect(food.mass).toEqual(1);
      expect(food.color).toBeDefined();
      expect(food.created_at).toBeInstanceOf(Date);
    });
  });

  it('should save food particles to database', async () => {
    const input: SpawnFoodInput = { count: 3 };
    const result = await spawnFood(input);

    // Verify all food particles are saved to database
    for (const food of result) {
      const dbFood = await db.select()
        .from(foodTable)
        .where(eq(foodTable.id, food.id))
        .execute();

      expect(dbFood).toHaveLength(1);
      expect(dbFood[0].id).toEqual(food.id);
      expect(dbFood[0].x).toEqual(food.x);
      expect(dbFood[0].y).toEqual(food.y);
      expect(dbFood[0].mass).toEqual(1);
      expect(dbFood[0].color).toEqual(food.color);
      expect(dbFood[0].created_at).toBeInstanceOf(Date);
    }
  });

  it('should use default count when count is 1', async () => {
    const input: SpawnFoodInput = { count: 1 };
    const result = await spawnFood(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].mass).toEqual(1);
  });

  it('should generate food with valid colors', async () => {
    const input: SpawnFoodInput = { count: 10 };
    const result = await spawnFood(input);

    const validColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    result.forEach(food => {
      expect(validColors).toContain(food.color);
    });
  });

  it('should generate food within map boundaries', async () => {
    const input: SpawnFoodInput = { count: 20 };
    const result = await spawnFood(input);

    result.forEach(food => {
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThanOrEqual(2000);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThanOrEqual(2000);
    });
  });
});
