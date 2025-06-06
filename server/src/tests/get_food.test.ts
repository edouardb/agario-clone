
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodTable } from '../db/schema';
import { getFood } from '../handlers/get_food';

describe('getFood', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no food exists', async () => {
    const result = await getFood();
    expect(result).toEqual([]);
  });

  it('should return all food particles', async () => {
    // Create test food particles
    await db.insert(foodTable)
      .values([
        {
          id: 'food1',
          x: 100.5,
          y: 200.75,
          mass: 1.0,
          color: '#ff0000'
        },
        {
          id: 'food2',
          x: 300.25,
          y: 400.5,
          mass: 1.5,
          color: '#00ff00'
        }
      ])
      .execute();

    const result = await getFood();

    expect(result).toHaveLength(2);
    
    // Verify first food particle
    const food1 = result.find(f => f.id === 'food1');
    expect(food1).toBeDefined();
    expect(food1!.x).toEqual(100.5);
    expect(food1!.y).toEqual(200.75);
    expect(food1!.mass).toEqual(1.0);
    expect(food1!.color).toEqual('#ff0000');
    expect(food1!.created_at).toBeInstanceOf(Date);
    expect(typeof food1!.x).toBe('number');
    expect(typeof food1!.y).toBe('number');
    expect(typeof food1!.mass).toBe('number');

    // Verify second food particle
    const food2 = result.find(f => f.id === 'food2');
    expect(food2).toBeDefined();
    expect(food2!.x).toEqual(300.25);
    expect(food2!.y).toEqual(400.5);
    expect(food2!.mass).toEqual(1.5);
    expect(food2!.color).toEqual('#00ff00');
    expect(food2!.created_at).toBeInstanceOf(Date);
    expect(typeof food2!.x).toBe('number');
    expect(typeof food2!.y).toBe('number');
    expect(typeof food2!.mass).toBe('number');
  });

  it('should handle single food particle correctly', async () => {
    // Create single test food particle
    await db.insert(foodTable)
      .values({
        id: 'single-food',
        x: 50.25,
        y: 75.5,
        mass: 2.0,
        color: '#0000ff'
      })
      .execute();

    const result = await getFood();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('single-food');
    expect(result[0].x).toEqual(50.25);
    expect(result[0].y).toEqual(75.5);
    expect(result[0].mass).toEqual(2.0);
    expect(result[0].color).toEqual('#0000ff');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
