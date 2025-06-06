
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PlayerNameDialogProps {
  onCreatePlayer: (name: string) => Promise<void>;
  isLoading: boolean;
}

export function PlayerNameDialog({ onCreatePlayer, isLoading }: PlayerNameDialogProps) {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      await onCreatePlayer(playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            🦠 Agar.io Clone
          </CardTitle>
          <p className="text-white/70">
            Consume food and smaller players to grow bigger!
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="playerName" className="text-white font-medium">
                Enter your name:
              </label>
              <Input
                id="playerName"
                type="text"
                placeholder="Your player name"
                value={playerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
                maxLength={20}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!playerName.trim() || isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Player...
                </div>
              ) : (
                '🚀 Start Playing!'
              )}
            </Button>
          </form>
          
          <div className="mt-6 space-y-2 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <span>🖱️</span>
              <span>Move your mouse to control your cell</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🍎</span>
              <span>Click near food particles to consume them</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🦠</span>
              <span>Eat smaller players to grow bigger</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏆</span>
              <span>Climb the leaderboard and become #1!</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
