
import { z } from 'zod';

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  mass: z.number(),
  color: z.string(),
  is_alive: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Player = z.infer<typeof playerSchema>;

// Food particle schema
export const foodSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  mass: z.number(),
  color: z.string(),
  created_at: z.coerce.date()
});

export type Food = z.infer<typeof foodSchema>;

// Game state schema
export const gameStateSchema = z.object({
  id: z.string(),
  map_width: z.number(),
  map_height: z.number(),
  max_players: z.number(),
  food_spawn_rate: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type GameState = z.infer<typeof gameStateSchema>;

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  player_id: z.string(),
  player_name: z.string(),
  mass: z.number(),
  rank: z.number()
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// Input schemas
export const createPlayerInputSchema = z.object({
  name: z.string().min(1).max(20),
  x: z.number().optional(),
  y: z.number().optional()
});

export type CreatePlayerInput = z.infer<typeof createPlayerInputSchema>;

export const updatePlayerPositionInputSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number()
});

export type UpdatePlayerPositionInput = z.infer<typeof updatePlayerPositionInputSchema>;

export const consumeInputSchema = z.object({
  player_id: z.string(),
  target_id: z.string(),
  target_type: z.enum(['player', 'food'])
});

export type ConsumeInput = z.infer<typeof consumeInputSchema>;

export const spawnFoodInputSchema = z.object({
  count: z.number().int().positive().optional().default(1)
});

export type SpawnFoodInput = z.infer<typeof spawnFoodInputSchema>;

// WebSocket message schemas
export const gameEventSchema = z.object({
  type: z.enum(['player_joined', 'player_left', 'player_moved', 'player_consumed', 'food_spawned', 'food_consumed', 'leaderboard_updated']),
  data: z.unknown()
});

export type GameEvent = z.infer<typeof gameEventSchema>;

export const playerJoinedEventSchema = z.object({
  type: z.literal('player_joined'),
  data: playerSchema
});

export type PlayerJoinedEvent = z.infer<typeof playerJoinedEventSchema>;

export const playerMovedEventSchema = z.object({
  type: z.literal('player_moved'),
  data: z.object({
    id: z.string(),
    x: z.number(),
    y: z.number()
  })
});

export type PlayerMovedEvent = z.infer<typeof playerMovedEventSchema>;

export const consumeEventSchema = z.object({
  type: z.literal('player_consumed'),
  data: z.object({
    consumer_id: z.string(),
    consumed_id: z.string(),
    new_mass: z.number(),
    target_type: z.enum(['player', 'food'])
  })
});

export type ConsumeEvent = z.infer<typeof consumeEventSchema>;
