
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

// WebSocket message schemas - Client to Server
export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('move'),
    data: z.object({
      playerId: z.string(),
      targetX: z.number(),
      targetY: z.number()
    })
  }),
  z.object({
    type: z.literal('consume'),
    data: z.object({
      playerId: z.string(),
      targetId: z.string(),
      targetType: z.enum(['player', 'food'])
    })
  }),
  z.object({
    type: z.literal('ping'),
    data: z.object({
      timestamp: z.number()
    })
  })
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

// WebSocket message schemas - Server to Client
export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('game_state'),
    data: z.object({
      players: z.array(playerSchema),
      food: z.array(foodSchema),
      gameState: gameStateSchema
    })
  }),
  z.object({
    type: z.literal('player_update'),
    data: z.object({
      player: playerSchema
    })
  }),
  z.object({
    type: z.literal('player_consumed'),
    data: z.object({
      consumerId: z.string(),
      consumedId: z.string(),
      newMass: z.number(),
      targetType: z.enum(['player', 'food'])
    })
  }),
  z.object({
    type: z.literal('player_died'),
    data: z.object({
      playerId: z.string()
    })
  }),
  z.object({
    type: z.literal('food_spawned'),
    data: z.object({
      food: z.array(foodSchema)
    })
  }),
  z.object({
    type: z.literal('pong'),
    data: z.object({
      timestamp: z.number()
    })
  }),
  z.object({
    type: z.literal('error'),
    data: z.object({
      message: z.string()
    })
  })
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

// Game state update for real-time sync
export const gameStateUpdateSchema = z.object({
  players: z.array(playerSchema),
  food: z.array(foodSchema),
  gameState: gameStateSchema
});

export type GameStateUpdate = z.infer<typeof gameStateUpdateSchema>;
