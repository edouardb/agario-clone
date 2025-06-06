import { z } from 'zod';
import { clientMessageSchema, type ServerMessage, type ClientMessage } from '../schema';
import { getPlayers } from './get_players';
import { getFood } from './get_food';
import { getGameState } from './get_game_state';
import { updatePlayerPosition } from './update_player_position';
import { consumeTarget } from './consume_target';
import { spawnFood } from './spawn_food';

interface ConnectedClient {
  ws: any; // WebSocket type - will work with Bun's WebSocket implementation
  playerId?: string;
  lastPing: number;
}

interface ClientHandler {
  onMessage: (data: string) => Promise<void>;
  onClose: () => void;
}

class WebSocketManager {
  private clients: Map<any, ConnectedClient> = new Map();
  private clientHandlers: Map<any, ClientHandler> = new Map();
  private gameLoopInterval: Timer | null = null;
  private foodSpawnInterval: Timer | null = null;

  constructor() {
    this.startGameLoop();
    this.startFoodSpawner();
    console.log('WebSocket manager initialized');
  }

  public addClient(ws: any): ClientHandler {
    console.log('New WebSocket connection');
    
    const client: ConnectedClient = {
      ws,
      lastPing: Date.now()
    };
    
    this.clients.set(ws, client);

    const handler: ClientHandler = {
      onMessage: async (data: string) => {
        try {
          const message = JSON.parse(data);
          const parsedMessage = clientMessageSchema.parse(message);
          await this.handleClientMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Error parsing client message:', error);
          this.sendToClient(ws, {
            type: 'error',
            data: { message: 'Invalid message format' }
          });
        }
      },
      onClose: () => {
        console.log('WebSocket connection closed');
        const client = this.clients.get(ws);
        if (client?.playerId) {
          // Notify other clients that player left
          this.broadcastToOthers(ws, {
            type: 'player_died',
            data: { playerId: client.playerId }
          });
        }
        this.clients.delete(ws);
        this.clientHandlers.delete(ws);
      }
    };

    this.clientHandlers.set(ws, handler);

    // Send initial game state
    this.sendGameState(ws);

    return handler;
  }

  public getClientHandler(ws: any): ClientHandler | undefined {
    return this.clientHandlers.get(ws);
  }

  private async handleClientMessage(ws: any, message: ClientMessage) {
    const client = this.clients.get(ws);
    if (!client) return;

    try {
      switch (message.type) {
        case 'move':
          if (message.data.playerId) {
            client.playerId = message.data.playerId;
            await updatePlayerPosition({
              id: message.data.playerId,
              x: message.data.targetX,
              y: message.data.targetY
            });
          }
          break;

        case 'consume':
          if (message.data.playerId) {
            client.playerId = message.data.playerId;
            try {
              await consumeTarget({
                player_id: message.data.playerId,
                target_id: message.data.targetId,
                target_type: message.data.targetType
              });

              // Get updated player data and broadcast consumption event
              const players = await getPlayers();
              const updatedPlayer = players.find(p => p.id === message.data.playerId);
              
              if (updatedPlayer) {
                this.broadcastToAll({
                  type: 'player_consumed',
                  data: {
                    consumerId: message.data.playerId,
                    consumedId: message.data.targetId,
                    newMass: updatedPlayer.mass,
                    targetType: message.data.targetType
                  }
                });
              }
            } catch (error) {
              console.error('Consumption failed:', error);
              this.sendToClient(ws, {
                type: 'error',
                data: { message: 'Failed to consume target' }
              });
            }
          }
          break;

        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(ws, {
            type: 'pong',
            data: { timestamp: message.data.timestamp }
          });
          break;
      }
    } catch (error) {
      console.error('Error handling client message:', error);
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Server error processing request' }
      });
    }
  }

  private sendToClient(ws: any, message: ServerMessage) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  }

  private broadcastToAll(message: ServerMessage) {
    this.clients.forEach(({ ws }) => {
      this.sendToClient(ws, message);
    });
  }

  private broadcastToOthers(excludeWs: any, message: ServerMessage) {
    this.clients.forEach(({ ws }) => {
      if (ws !== excludeWs) {
        this.sendToClient(ws, message);
      }
    });
  }

  private async sendGameState(ws?: any) {
    try {
      const [players, food, gameState] = await Promise.all([
        getPlayers(),
        getFood(),
        getGameState()
      ]);

      const message: ServerMessage = {
        type: 'game_state',
        data: { players, food, gameState }
      };

      if (ws) {
        this.sendToClient(ws, message);
      } else {
        this.broadcastToAll(message);
      }
    } catch (error) {
      console.error('Error sending game state:', error);
    }
  }

  private startGameLoop() {
    // High-frequency game loop for smooth updates
    this.gameLoopInterval = setInterval(async () => {
      await this.sendGameState();
    }, 50); // 20 FPS
  }

  private startFoodSpawner() {
    // Spawn food periodically
    this.foodSpawnInterval = setInterval(async () => {
      try {
        await spawnFood({ count: 3 });
        
        // Get updated food list and broadcast
        const food = await getFood();
        this.broadcastToAll({
          type: 'food_spawned',
          data: { food }
        });
      } catch (error) {
        console.error('Error spawning food:', error);
      }
    }, 2000); // Every 2 seconds
  }

  public stop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    
    if (this.foodSpawnInterval) {
      clearInterval(this.foodSpawnInterval);
      this.foodSpawnInterval = null;
    }
  }
}

export { WebSocketManager };