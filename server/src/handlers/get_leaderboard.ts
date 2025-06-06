
import { type LeaderboardEntry } from '../schema';

export declare function getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
