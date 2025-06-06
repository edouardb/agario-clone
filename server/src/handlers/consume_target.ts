
import { db } from '../db';
import { playersTable, foodTable } from '../db/schema';
import { type ConsumeInput, type Player } from '../schema';
import { eq, and } from 'drizzle-orm';

export const consumeTarget = async (input: ConsumeInput): Promise<Player> => {
  try {
    // Get the consuming player
    const consumers = await db.select()
      .from(playersTable)
      .where(and(
        eq(playersTable.id, input.player_id),
        eq(playersTable.is_alive, true)
      ))
      .execute();

    if (consumers.length === 0) {
      throw new Error('Player not found or not alive');
    }

    const consumer = consumers[0];

    if (input.target_type === 'food') {
      // Find and consume food
      const foodItems = await db.select()
        .from(foodTable)
        .where(eq(foodTable.id, input.target_id))
        .execute();

      if (foodItems.length === 0) {
        throw new Error('Food not found');
      }

      const food = foodItems[0];

      // Delete the food
      await db.delete(foodTable)
        .where(eq(foodTable.id, input.target_id))
        .execute();

      // Update player mass
      const newMass = consumer.mass + food.mass;
      const updatedPlayers = await db.update(playersTable)
        .set({
          mass: newMass,
          updated_at: new Date()
        })
        .where(eq(playersTable.id, input.player_id))
        .returning()
        .execute();

      return updatedPlayers[0];

    } else {
      // Consume another player
      const targetPlayers = await db.select()
        .from(playersTable)
        .where(and(
          eq(playersTable.id, input.target_id),
          eq(playersTable.is_alive, true)
        ))
        .execute();

      if (targetPlayers.length === 0) {
        throw new Error('Target player not found or not alive');
      }

      const target = targetPlayers[0];

      // Check if consumer is large enough to consume target
      if (consumer.mass <= target.mass) {
        throw new Error('Player not large enough to consume target');
      }

      // Mark target player as dead
      await db.update(playersTable)
        .set({
          is_alive: false,
          updated_at: new Date()
        })
        .where(eq(playersTable.id, input.target_id))
        .execute();

      // Update consumer mass (gain a portion of target's mass)
      const massGain = target.mass * 0.5; // Gain 50% of target's mass
      const newMass = consumer.mass + massGain;
      
      const updatedPlayers = await db.update(playersTable)
        .set({
          mass: newMass,
          updated_at: new Date()
        })
        .where(eq(playersTable.id, input.player_id))
        .returning()
        .execute();

      return updatedPlayers[0];
    }
  } catch (error) {
    console.error('Consume target failed:', error);
    throw error;
  }
};
