
import { db } from '../db';
import { foodTable } from '../db/schema';
import { type Food } from '../schema';

export const getFood = async (): Promise<Food[]> => {
  try {
    // Get all food particles
    const results = await db.select()
      .from(foodTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(food => ({
      ...food,
      x: parseFloat(food.x.toString()),
      y: parseFloat(food.y.toString()),
      mass: parseFloat(food.mass.toString())
    }));
  } catch (error) {
    console.error('Get food failed:', error);
    throw error;
  }
};
