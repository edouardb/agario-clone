
import { db } from '../db';
import { foodTable } from '../db/schema';
import { type SpawnFoodInput, type Food } from '../schema';

export const spawnFood = async (input: SpawnFoodInput): Promise<Food[]> => {
  try {
    const foodItems: Food[] = [];
    
    for (let i = 0; i < input.count; i++) {
      // Generate random position within map bounds (0-2000)
      const x = Math.random() * 2000;
      const y = Math.random() * 2000;
      
      // Generate random color
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Generate unique ID
      const id = `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await db.insert(foodTable)
        .values({
          id,
          x,
          y,
          mass: 1, // Default mass for food particles
          color
        })
        .returning()
        .execute();
      
      foodItems.push(result[0]);
    }
    
    return foodItems;
  } catch (error) {
    console.error('Food spawning failed:', error);
    throw error;
  }
};
