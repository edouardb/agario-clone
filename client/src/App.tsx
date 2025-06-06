
import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameCanvas } from '@/components/GameCanvas';
import { Leaderboard } from '@/components/Leaderboard';
import { PlayerNameDialog } from '@/components/PlayerNameDialog';
import type { Player, Food, GameState } from '../../server/src/schema';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [food, setFood] = useState<Food[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  
  // Mouse position for player movement
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Initialize game
  const initializeGame = useCallback(async () => {
    try {
      await trpc.initializeGame.mutate();
      const gameStateData = await trpc.getGameState.query();
      setGameState(gameStateData);
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }, []);

  // Load game data
  const loadGameData = useCallback(async () => {
    try {
      const [playersData, foodData] = await Promise.all([
        trpc.getPlayers.query(),
        trpc.getFood.query()
      ]);
      setPlayers(playersData);
      setFood(foodData);
    } catch (error) {
      console.error('Failed to load game data:', error);
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
      await loadGameData();
    } catch (error) {
      console.error('Failed to create player:', error);
    } finally {
      setGameLoading(false);
    }
  };

  // Update player position based on mouse
  const updatePlayerPosition = useCallback(async (x: number, y: number) => {
    if (!currentPlayer) return;
    
    try {
      await trpc.updatePlayerPosition.mutate({
        id: currentPlayer.id,
        x,
        y
      });
      // Update local state
      setCurrentPlayer(prev => prev ? { ...prev, x, y } : null);
      setPlayers(prev => prev.map(p => 
        p.id === currentPlayer.id ? { ...p, x, y } : p
      ));
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  }, [currentPlayer]);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gameContainerRef.current || !currentPlayer || !gameState) return;
    
    const rect = gameContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * gameState.map_width;
    const y = ((e.clientY - rect.top) / rect.height) * gameState.map_height;
    
    setMousePos({ x, y });
    updatePlayerPosition(x, y);
  }, [currentPlayer, gameState, updatePlayerPosition]);

  // Try to consume targets
  const tryConsume = useCallback(async (targetId: string, targetType: 'player' | 'food') => {
    if (!currentPlayer) return;
    
    try {
      await trpc.consumeTarget.mutate({
        player_id: currentPlayer.id,
        target_id: targetId,
        target_type: targetType
      });
      // Reload game data after consumption
      await loadGameData();
      // Update current player data
      const updatedPlayers = await trpc.getPlayers.query();
      const updatedCurrentPlayer = updatedPlayers.find(p => p.id === currentPlayer.id);
      if (updatedCurrentPlayer) {
        setCurrentPlayer(updatedCurrentPlayer);
      }
    } catch (error) {
      console.error('Failed to consume target:', error);
    }
  }, [currentPlayer, loadGameData]);

  // Auto-spawn food periodically
  useEffect(() => {
    if (!isGameStarted) return;
    
    const spawnInterval = setInterval(async () => {
      try {
        await trpc.spawnFood.mutate({ count: 5 });
        await loadGameData();
      } catch (error) {
        console.error('Failed to spawn food:', error);
      }
    }, 3000);
    
    return () => clearInterval(spawnInterval);
  }, [isGameStarted, loadGameData]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Refresh game data periodically
  useEffect(() => {
    if (!isGameStarted) return;
    
    const refreshInterval = setInterval(() => {
      loadGameData();
    }, 1000);
    
    return () => clearInterval(refreshInterval);
  }, [isGameStarted, loadGameData]);

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
            return distance < 20;
          });
          
          if (nearbyFood) {
            tryConsume(nearbyFood.id, 'food');
            return;
          }
          
          const nearbyPlayer = players.find(p => {
            if (p.id === currentPlayer.id || p.mass >= currentPlayer.mass) return false;
            const distance = Math.sqrt(Math.pow(p.x - clickX, 2) + Math.pow(p.y - clickY, 2));
            return distance < Math.max(currentPlayer.mass / 2, 15);
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
