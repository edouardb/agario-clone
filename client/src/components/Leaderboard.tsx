
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { LeaderboardEntry } from '../../../server/src/schema';

interface LeaderboardProps {
  currentPlayerId: string;
}

export function Leaderboard({ currentPlayerId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getLeaderboard.query(10);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    
    // Reduce polling frequency since WebSocket provides real-time updates
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 5000); // Every 5 seconds instead of 2
    
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🦠';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 2: return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 3: return 'bg-orange-600/20 text-orange-300 border-orange-600/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <Card className="w-72 bg-black/20 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          🏆 Leaderboard
          {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
        {leaderboard.length === 0 ? (
          <div className="text-white/60 text-sm text-center py-4">
            No players yet...
          </div>
        ) : (
          leaderboard.map((entry: LeaderboardEntry) => {
            const isCurrentPlayer = entry.player_id === currentPlayerId;
            
            return (
              <div
                key={entry.player_id}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isCurrentPlayer 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={getRankColor(entry.rank)}>
                    {getRankEmoji(entry.rank)} #{entry.rank}
                  </Badge>
                  <div>
                    <div className={`font-medium ${isCurrentPlayer ? 'text-green-300' : 'text-white'}`}>
                      {entry.player_name}
                      {isCurrentPlayer && <span className="text-green-400 ml-1">(You)</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${isCurrentPlayer ? 'text-green-300' : 'text-white'}`}>
                    {entry.mass}
                  </div>
                  <div className="text-xs text-white/60">mass</div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
