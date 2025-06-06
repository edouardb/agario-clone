
import { text, pgTable, timestamp, real, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const playersTable = pgTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  mass: real('mass').notNull().default(10),
  color: text('color').notNull(),
  is_alive: boolean('is_alive').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const foodTable = pgTable('food', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  mass: real('mass').notNull().default(1),
  color: text('color').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const gameStateTable = pgTable('game_state', {
  id: text('id').primaryKey(),
  map_width: real('map_width').notNull().default(2000),
  map_height: real('map_height').notNull().default(2000),
  max_players: integer('max_players').notNull().default(50),
  food_spawn_rate: real('food_spawn_rate').notNull().default(0.5),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const playersRelations = relations(playersTable, ({ many }) => ({
  consumedFood: many(foodTable),
}));

export const foodRelations = relations(foodTable, ({ one }) => ({
  consumedBy: one(playersTable),
}));

// Export all tables for proper query building
export const tables = {
  players: playersTable,
  food: foodTable,
  gameState: gameStateTable
};

// TypeScript types
export type Player = typeof playersTable.$inferSelect;
export type NewPlayer = typeof playersTable.$inferInsert;
export type Food = typeof foodTable.$inferSelect;
export type NewFood = typeof foodTable.$inferInsert;
export type GameState = typeof gameStateTable.$inferSelect;
export type NewGameState = typeof gameStateTable.$inferInsert;
