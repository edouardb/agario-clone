import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameCanvas } from '@/components/GameCanvas';
import { Leaderboard } from '@/components/Leaderboard';
import { PlayerNameDialog } from '@/components/PlayerNameDialog';
import type { Player, Food, GameState, ClientMessage, ServerMessage } from '../../server/src/schema';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [food, setFood] = useState<Food[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  // Mouse position for player movement
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<Timer | null>(null);
  const pingIntervalRef = useRef<Timer | null>(null);

  // Initialize game (only needed for initial setup now)
  const initializeGame = useCallback(async () => {
    try {
      await trpc.initializeGame.mutate();
      const gameStateData = await trpc.getGameState.query();
      setGameState(gameStateData);
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!currentPlayer) return;

    const wsUrl = `ws://localhost:3001`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setConnectionStatus('connecting');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      
      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const pingMessage: ClientMessage = {
            type: 'ping',
            data: { timestamp: Date.now() }
          };
          ws.send(JSON.stringify(pingMessage));
        }
      }, 30000); // Ping every 30 seconds
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (error) {
        console.error('Error parsing server message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      
      // Clear intervals
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      // Attempt to reconnect after 3 seconds
      if (currentPlayer && isGameStarted) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
  }, [currentPlayer, isGameStarted]);

  // Handle server messages
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'game_state':
        setPlayers(message.data.players);
        setFood(message.data.food);
        setGameState(message.data.gameState);
        
        // Update current player data
        if (currentPlayer) {
          const updatedCurrentPlayer = message.data.players.find(p => p.id === currentPlayer.id);
          if (updatedCurrentPlayer && updatedCurrentPlayer.is_alive) {
            setCurrentPlayer(updatedCurrentPlayer);
          } else {
            // Player was consumed/died
            console.log('Player died, returning to name dialog');
            setCurrentPlayer(null);
            setIsGameStarted(false);
            setShowNameDialog(true);
          }
        }
        break;

      case 'player_update':
        setPlayers(prev => prev.map(p => 
          p.id === message.data.player.id ? message.data.player : p
        ));
        
        if (currentPlayer && message.data.player.id === currentPlayer.id) {
          setCurrentPlayer(message.data.player);
        }
        break;

      case 'player_consumed':
        console.log(`Player ${message.data.consumerId} consumed ${message.data.consumedId}`);
        break;

      case 'player_died':
        console.log(`Player ${message.data.playerId} died`);
        if (currentPlayer && message.data.playerId === currentPlayer.id) {
          setCurrentPlayer(null);
          setIsGameStarted(false);
          setShowNameDialog(true);
        }
        break;

      case 'food_spawned':
        setFood(message.data.food);
        break;

      case 'pong':
        // Handle ping response if needed
        break;

      case 'error':
        console.error('Server error:', message.data.message);
        break;
    }
  }, [currentPlayer]);

  // Send WebSocket message
  const sendWebSocketMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Create player
  const createPlayer = async (name: string) => {
    setGameLoading(true);
    try {
      const newPlayer = await trpc.createPlayer.mutate({ name });
      setCurrentPlayer(newPlayer);
      setShowNameDialog(false);
      setIsGameStarted(true);
    } catch (error) {
      console.error('Failed to create player:', error);
    } finally {
      setGameLoading(false);
    }
  };

  // Update player position via WebSocket
  const updatePlayerPosition = useCallback((x: number, y: number) => {
    if (!currentPlayer) return;
    
    const message: ClientMessage = {
      type: 'move',
      data: {
        playerId: currentPlayer.id,
        targetX: x,
        targetY: y
      }
    };
    
    sendWebSocketMessage(message);
    
    // Optimistically update local position for smoother movement
    setCurrentPlayer(prev => prev ? { ...prev, x, y } : null);
  }, [currentPlayer, sendWebSocketMessage]);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameContainerRef.current || !currentPlayer || !gameState) return;
    
    const rect = gameContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * gameState.map_width;
    const y = ((e.clientY - rect.top) / rect.height) * gameState.map_height;
    
    setMousePos({ x, y });
    updatePlayerPosition(x, y);
  }, [currentPlayer, gameState, updatePlayerPosition]);

  // Try to consume targets via WebSocket
  const tryConsume = useCallback((targetId: string, targetType: 'player' | 'food') => {
    if (!currentPlayer) return;
    
    const message: ClientMessage = {
      type: 'consume',
      data: {
        playerId: currentPlayer.id,
        targetId,
        targetType
      }
    };
    
    sendWebSocketMessage(message);
  }, [currentPlayer, sendWebSocketMessage]);

  // Connect WebSocket when game starts
  useEffect(() => {
    if (isGameStarted && currentPlayer) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [isGameStarted, currentPlayer, connectWebSocket]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  if (showNameDialog) {
    return <PlayerNameDialog onCreatePlayer={createPlayer} isLoading={gameLoading} />;
  }

  if (!gameState || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">🦠 Agar.io Clone</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Game Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <div className="text-white text-sm space-y-1">
              <div>🦠 <span className="font-bold">{currentPlayer.name}</span></div>
              <div>Mass: <span className="font-bold text-green-400">{currentPlayer.mass}</span></div>
              <div className="text-xs opacity-75">
                Position: ({Math.round(currentPlayer.x)}, {Math.round(currentPlayer.y)})
              </div>
              <div className="text-xs flex items-center gap-1">
                Connection: 
                <span className={`inline-block w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></span>
                <span className={
                  connectionStatus === 'connected' ? 'text-green-400' : 
                  connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                }>
                  {connectionStatus}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Leaderboard currentPlayerId={currentPlayer.id} />
      </div>

      {/* Game Canvas */}
      <div 
        ref={gameContainerRef}
        className="w-full h-screen cursor-none"
        onMouseMove={handleMouseMove}
        onClick={(e) => {
          // Try to consume nearby targets when clicking
          const rect = gameContainerRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const clickX = ((e.clientX - rect.left) / rect.width) * gameState.map_width;
          const clickY = ((e.clientY - rect.top) / rect.height) * gameState.map_height;
          
          // Find nearby food or smaller players
          const nearbyFood = food.find(f => {
            const distance = Math.sqrt(Math.pow(f.x - clickX, 2) + Math.pow(f.y - clickY, 2));
            return distance < 30;
          });
          
          if (nearbyFood) {
            tryConsume(nearbyFood.id, 'food');
            return;
          }
          
          const nearbyPlayer = players.find(p => {
            if (p.id === currentPlayer.id || p.mass >= currentPlayer.mass || !p.is_alive) return false;
            const distance = Math.sqrt(Math.pow(p.x - clickX, 2) + Math.pow(p.y - clickY, 2));
            return distance < Math.max(currentPlayer.mass / 2, 20);
          });
          
          if (nearbyPlayer) {
            tryConsume(nearbyPlayer.id, 'player');
          }
        }}
      >
        <GameCanvas
          gameState={gameState}
          players={players}
          food={food}
          currentPlayer={currentPlayer}
          mousePos={mousePos}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-black/20 backdrop-blur-sm border-white/10">
          <CardContent className="p-3">
            <div className="text-white text-xs space-y-1">
              <div>🖱️ Move mouse to control your cell</div>
              <div>🍎 Click near food to consume it</div>
              <div>🦠 Click near smaller players to consume them</div>
              <div>📈 Grow bigger to climb the leaderboard!</div>
              <div className="text-yellow-300">⚡ Real-time multiplayer via WebSocket</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;