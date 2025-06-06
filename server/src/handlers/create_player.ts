
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreatePlayerInput, type Player } from '../schema';

// Helper function to generate random color
const generateRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to generate random position within game bounds
const generateRandomPosition = (): { x: number; y: number } => {
  // Default game map size (matches schema defaults)
  const MAP_WIDTH = 2000;
  const MAP_HEIGHT = 2000;
  
  return {
    x: Math.random() * MAP_WIDTH,
    y: Math.random() * MAP_HEIGHT
  };
};

export const createPlayer = async (input: CreatePlayerInput): Promise<Player> => {
  try {
    // Generate random position if not provided
    const position = (input.x !== undefined && input.y !== undefined) 
      ? { x: input.x, y: input.y }
      : generateRandomPosition();

    // Generate unique ID and random color
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const color = generateRandomColor();

    // Insert player record
    const result = await db.insert(playersTable)
      .values({
        id: playerId,
        name: input.name,
        x: position.x,
        y: position.y,
        mass: 10, // Default starting mass
        color: color,
        is_alive: true
      })
      .returning()
      .execute();

    const player = result[0];
    return {
      ...player,
      // Convert real columns back to numbers (they're stored as numbers in PostgreSQL)
      x: Number(player.x),
      y: Number(player.y),
      mass: Number(player.mass)
    };
  } catch (error) {
    console.error('Player creation failed:', error);
    throw error;
  }
};
