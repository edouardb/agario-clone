
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createPlayerInputSchema, 
  updatePlayerPositionInputSchema,
  consumeInputSchema,
  spawnFoodInputSchema
} from './schema';

// Import handlers
import { createPlayer } from './handlers/create_player';
import { getPlayers } from './handlers/get_players';
import { getPlayer } from './handlers/get_player';
import { updatePlayerPosition } from './handlers/update_player_position';
import { deletePlayer } from './handlers/delete_player';
import { getFood } from './handlers/get_food';
import { spawnFood } from './handlers/spawn_food';
import { consumeTarget } from './handlers/consume_target';
import { getLeaderboard } from './handlers/get_leaderboard';
import { getGameState } from './handlers/get_game_state';
import { initializeGame } from './handlers/initialize_game';
import { WebSocketManager } from './handlers/websocket_manager';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Game initialization
  initializeGame: publicProcedure
    .mutation(() => initializeGame()),

  getGameState: publicProcedure
    .query(() => getGameState()),

  // Player management
  createPlayer: publicProcedure
    .input(createPlayerInputSchema)
    .mutation(({ input }) => createPlayer(input)),

  getPlayers: publicProcedure
    .query(() => getPlayers()),

  getPlayer: publicProcedure
    .input(z.string())
    .query(({ input }) => getPlayer(input)),

  updatePlayerPosition: publicProcedure
    .input(updatePlayerPositionInputSchema)
    .mutation(({ input }) => updatePlayerPosition(input)),

  deletePlayer: publicProcedure
    .input(z.string())
    .mutation(({ input }) => deletePlayer(input)),

  // Food management
  getFood: publicProcedure
    .query(() => getFood()),

  spawnFood: publicProcedure
    .input(spawnFoodInputSchema)
    .mutation(({ input }) => spawnFood(input)),

  // Game mechanics
  consumeTarget: publicProcedure
    .input(consumeInputSchema)
    .mutation(({ input }) => consumeTarget(input)),

  // Leaderboard
  getLeaderboard: publicProcedure
    .input(z.number().int().positive().optional())
    .query(({ input }) => getLeaderboard(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const wsPort = process.env['WS_PORT'] || 3001;
  
  // Initialize WebSocket manager
  const wsManager = new WebSocketManager();
  
  // Start TRPC HTTP server
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);

  // Start WebSocket server using Bun's built-in WebSocket support
  const wsServer = Bun.serve({
    port: wsPort,
    fetch(req: Request, server: any) {
      const url = new URL(req.url);
      
      // Only allow WebSocket upgrades
      if (req.headers.get('upgrade') === 'websocket') {
        const upgraded = server.upgrade(req);
        if (upgraded) {
          return undefined; // Bun will handle the WebSocket connection
        }
      }
      
      // Return 404 for non-WebSocket requests
      return new Response('WebSocket endpoint', { status: 404 });
    },
    websocket: {
      open(ws: any) {
        console.log('WebSocket client connected');
        wsManager.addClient(ws);
      },
      message(ws: any, message: string | Buffer) {
        const clientHandler = wsManager.getClientHandler(ws);
        if (clientHandler && typeof message === 'string') {
          clientHandler.onMessage(message);
        }
      },
      close(ws: any) {
        console.log('WebSocket client disconnected');
        const clientHandler = wsManager.getClientHandler(ws);
        if (clientHandler) {
          clientHandler.onClose();
        }
      }
    },
  });
  
  console.log(`WebSocket server listening at port: ${wsPort}`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down servers...');
    server.close();
    wsServer.stop();
    wsManager.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    server.close();
    wsServer.stop();
    wsManager.stop();
    process.exit(0);
  });
}

start();
