import React, { useState, useEffect } from 'react';
import { Group, Match, Prediction, LeaderboardEntry } from '../types';
import { dbService } from '../services/db';
import { Trophy, Medal } from 'lucide-react';
import { motion } from 'motion/react';

export function LeaderboardTab({ group, matches }: { group: Group, matches: Match[] }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'general' | 'round'>('general');
  const [latestPhase, setLatestPhase] = useState<string>('');

  useEffect(() => {
    calculateLeaderboard();
  }, [group, matches, viewMode]);

  const calculateLeaderboard = async () => {
    setIsLoading(true);
    const preds = await dbService.getGroupPredictions(group.id);
    
    // Find the latest phase based on finished matches
    const finishedMatches = matches.filter(m => m.status === 'finished');
    let currentPhase = '';
    if (finishedMatches.length > 0) {
      const sortedFinished = [...finishedMatches].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      currentPhase = sortedFinished[0].phase;
    }
    setLatestPhase(currentPhase);

    // Map to hold temporary totals
    const userStats: Record<string, LeaderboardEntry> = {};
    
    // Initialize stats for all members (even if they made 0 predictions)
    group.members.forEach(m => {
      userStats[m.id] = { 
        user: m, 
        totalPoints: 0, 
        exactMatches: 0, 
        correctResults: 0,
        roundPoints: 0,
        predictionsInRound: 0,
        badges: []
      };
    });

    preds.forEach(p => {
      const match = matches.find(m => m.id === p.matchId);
      if (!match) return;

      if (match.status === 'finished' && p.points !== undefined && userStats[p.userId]) {
        userStats[p.userId].totalPoints += p.points;
        if (p.points === 3) userStats[p.userId].exactMatches += 1;
        if (p.points === 1) userStats[p.userId].correctResults += 1;

        if (match.phase === currentPhase) {
          userStats[p.userId].roundPoints = (userStats[p.userId].roundPoints || 0) + p.points;
          if (p.points === 3) userStats[p.userId].roundExactMatches = (userStats[p.userId].roundExactMatches || 0) + 1;
        }
      }
      
      if (match.phase === currentPhase && p.scoreA !== undefined && p.scoreB !== undefined && userStats[p.userId]) {
         userStats[p.userId].predictionsInRound = (userStats[p.userId].predictionsInRound || 0) + 1;
      }
    });

    // Calculate Badges
    const maxExactMatches = Math.max(...Object.values(userStats).map(u => u.exactMatches));
    const maxRoundPoints = Math.max(...Object.values(userStats).map(u => u.roundPoints || 0));

    Object.values(userStats).forEach(u => {
      if (u.exactMatches === maxExactMatches && maxExactMatches > 0) {
        u.badges?.push('mae-dinah');
      }
      if (u.roundPoints === maxRoundPoints && maxRoundPoints > 0 && currentPhase !== '') {
        u.badges?.push('craque');
      }
      if (u.predictionsInRound! > 0 && u.roundPoints === 0 && currentPhase !== '') {
        u.badges?.push('zica');
      }
    });

    // Sort based on view mode
    const sorted = Object.values(userStats).sort((a, b) => {
      if (viewMode === 'round') {
        const aRoundPts = a.roundPoints || 0;
        const bRoundPts = b.roundPoints || 0;
        if (bRoundPts !== aRoundPts) return bRoundPts - aRoundPts;
        const aRoundExact = a.roundExactMatches || 0;
        const bRoundExact = b.roundExactMatches || 0;
        if (bRoundExact !== aRoundExact) return bRoundExact - aRoundExact;
        return a.user.name.localeCompare(b.user.name);
      } else {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
        return a.user.name.localeCompare(b.user.name);
      }
    });

    setLeaderboard(sorted);
    setIsLoading(false);
  };

  if (isLoading) return <div className="text-center py-10 text-slate-500">Calculando ranking...</div>;

  return (
    <div className="pb-24">
      
      {/* Toggle View Mode */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 max-w-sm mx-auto">
        <button
          className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${viewMode === 'general' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setViewMode('general')}
        >
          Geral
        </button>
        <button
          className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${viewMode === 'round' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setViewMode('round')}
          disabled={!latestPhase}
        >
          Rodada Atual
        </button>
      </div>

      {/* Top 3 Podium (Visual Flare) */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 pt-4">
          {/* Silver - 2nd place */}
          <PodiumPlace entry={leaderboard[1]} points={viewMode === 'round' ? (leaderboard[1].roundPoints || 0) : leaderboard[1].totalPoints} position={2} color="bg-slate-300" height="h-24" matches={matches} />
          {/* Gold - 1st place */}
          <PodiumPlace entry={leaderboard[0]} points={viewMode === 'round' ? (leaderboard[0].roundPoints || 0) : leaderboard[0].totalPoints} position={1} color="bg-yellow-400" height="h-32" matches={matches} />
          {/* Bronze - 3rd place */}
          <PodiumPlace entry={leaderboard[2]} points={viewMode === 'round' ? (leaderboard[2].roundPoints || 0) : leaderboard[2].totalPoints} position={3} color="bg-amber-600" height="h-20" matches={matches} />
        </div>
      )}

      {/* List */}
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span className="w-12 text-center">Pos</span>
          <span className="flex-1">Membro</span>
          <span className="w-16 text-center">Exatos</span>
          <span className="w-16 text-center text-emerald-500 font-extrabold">Pts</span>
        </div>
        
        <div className="divide-y divide-slate-800/60 flex flex-col">
          {leaderboard.map((entry, index) => (
            <motion.div 
              layout
              key={entry.user.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                opacity: { delay: index * 0.05 },
                x: { delay: index * 0.05 },
                layout: { type: "spring", stiffness: 300, damping: 30 }
              }}
              className={`flex items-center px-4 py-4 rounded-xl ${index === 0 ? 'bg-emerald-500/10' : 'hover:bg-slate-800/40'}`}
            >
              <span className={`w-12 text-center font-black ${index === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 font-semibold text-slate-200 flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700 text-slate-400 relative overflow-hidden">
                  {entry.user.favoriteTeam ? (
                    <img src={`https://flagcdn.com/${matches.find(m => m.teamA === entry.user.favoriteTeam)?.teamAFlagCode || matches.find(m => m.teamB === entry.user.favoriteTeam)?.teamBFlagCode || 'xx'}.svg`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {entry.user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="truncate flex items-center gap-1.5">
                  <span className="truncate">{entry.user.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {entry.badges?.includes('craque') && <span title="Craque da Rodada: Mais pontos na última rodada" className="text-base cursor-default select-none">⭐</span>}
                    {entry.badges?.includes('mae-dinah') && <span title="Mãe Dináh: Mais placares exatos" className="text-base cursor-default select-none">🔮</span>}
                    {entry.badges?.includes('zica') && <span title="Zica: Errou tudo na última rodada (0 pts)" className="text-base cursor-default select-none">🥶</span>}
                  </div>
                </div>
              </div>
              <span className="w-16 text-center text-slate-400 text-sm font-bold">
                {viewMode === 'round' ? (entry.roundExactMatches || 0) : entry.exactMatches}
              </span>
              <span className="w-16 text-center font-black text-emerald-400 text-lg">
                {viewMode === 'round' ? (entry.roundPoints || 0) : entry.totalPoints}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Medalhas & Troféus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <div>
              <p className="text-sm font-bold text-slate-300">Craque da Rodada</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Mais pontos na última rodada</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <div>
              <p className="text-sm font-bold text-slate-300">Mãe Dináh</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Mais cravadas exatas no bolão</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🥶</span>
            <div>
              <p className="text-sm font-bold text-slate-300">Zica</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">0 pontos na última rodada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumPlace({ entry, position, color, height, points, matches }: { entry: LeaderboardEntry, position: number, color: string, height: string, points: number, matches: Match[] }) {
  if (!entry) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center"
    >
      <div className="w-10 h-10 rounded-full flex-shrink-0 bg-slate-800 flex items-center justify-center text-sm font-bold border-2 border-slate-700 text-slate-400 relative overflow-hidden mb-2 shadow-lg">
        {entry.user.favoriteTeam ? (
          <img src={`https://flagcdn.com/${matches.find(m => m.teamA === entry.user.favoriteTeam)?.teamAFlagCode || matches.find(m => m.teamB === entry.user.favoriteTeam)?.teamBFlagCode || 'xx'}.svg`} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
            {entry.user.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="font-bold text-slate-300 text-sm mb-1 truncate w-20 text-center">{entry.user.name.split(' ')[0]}</div>
      <div className="font-black text-emerald-400 text-lg mb-2">{points}</div>
      <div className={`w-20 sm:w-24 rounded-t-xl ${color} ${height} flex flex-col justify-start items-center shadow-lg border border-slate-950/50`}>
        <span className="mt-2 text-slate-950 font-black text-2xl drop-shadow-sm opacity-60">{position}</span>
        {position === 1 && <Medal className="text-slate-900 mt-1 w-6 h-6 stroke-2 drop-shadow-sm opacity-80" />}
      </div>
    </motion.div>
  )
}
