import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { WebSocketManager } from '../handlers/websocket_manager';
import { createPlayer } from '../handlers/create_player';
import type { CreatePlayerInput } from '../schema';

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  
  beforeEach(async () => {
    await createDB();
    wsManager = new WebSocketManager();
  });

  afterEach(async () => {
    wsManager.stop();
    await resetDB();
  });

  it('should initialize properly', () => {
    expect(wsManager).toBeDefined();
  });

  it('should handle client connections', async () => {
    // Create a mock WebSocket
    const mockWs = {
      send: (data: string) => {
        // Mock send implementation
        const message = JSON.parse(data);
        expect(message.type).toBe('game_state');
      }
    };

    const clientHandler = wsManager.addClient(mockWs);
    
    expect(clientHandler).toBeDefined();
    expect(clientHandler.onMessage).toBeFunction();
    expect(clientHandler.onClose).toBeFunction();
  });

  it('should handle move messages', async () => {
    // Create a test player first
    const testPlayer = await createPlayer({ name: 'Test Player' });
    
    const mockWs = {
      send: (data: string) => {
        // Mock implementation for receiving messages
      }
    };

    const clientHandler = wsManager.addClient(mockWs);
    
    const moveMessage = JSON.stringify({
      type: 'move',
      data: {
        playerId: testPlayer.id,
        targetX: 100,
        targetY: 200
      }
    });

    // Should not throw
    await clientHandler.onMessage(moveMessage);
  });

  it('should handle invalid messages gracefully', async () => {
    const mockWs = {
      send: (data: string) => {
        const message = JSON.parse(data);
        if (message.type === 'error') {
          expect(message.data.message).toBe('Invalid message format');
        }
      }
    };

    const clientHandler = wsManager.addClient(mockWs);
    
    // Send invalid JSON
    await clientHandler.onMessage('invalid json');
    
    // Send valid JSON but invalid schema
    await clientHandler.onMessage(JSON.stringify({ type: 'invalid' }));
  });
});