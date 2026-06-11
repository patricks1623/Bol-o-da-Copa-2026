import React, { useState } from 'react';
import { Group, Match, User } from '../types';
import { dbService } from '../services/db';
import { formatDate } from '../utils';

export function AdminTab({ matches, group, user, onUpdate }: { matches: Match[], group: Group, user: User, onUpdate: () => void }) {
  const now = new Date().getTime();
  const allPendingMatches = matches.filter(m => m.status !== 'finished');
  
  const pastPending = allPendingMatches.filter(m => new Date(m.date).getTime() <= now);
  const futurePending = allPendingMatches.filter(m => new Date(m.date).getTime() > now);
  
  const sortedFuture = [...futurePending].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentFuturePhase = sortedFuture.length > 0 ? sortedFuture[0].phase : null;
  
  const pendingMatches = [
    ...pastPending,
    ...futurePending.filter(m => m.phase === currentFuturePhase)
  ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const [newGroupName, setNewGroupName] = useState(group.name);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameUpdateMessage, setNameUpdateMessage] = useState('');

  const handleUpdateName = async () => {
    if (!newGroupName.trim() || newGroupName === group.name) return;
    setIsUpdatingName(true);
    setNameUpdateMessage('');
    try {
      await dbService.updateGroupName(group.id, newGroupName.trim());
      setNameUpdateMessage('Nome da liga atualizado!');
      setTimeout(() => setNameUpdateMessage(''), 3000);
    } catch (e) {
      setNameUpdateMessage('Erro ao atualizar nome.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  if (user.id !== group.adminId) {
    return (
      <div className="text-center py-10 bg-slate-900 rounded-xl shadow-sm border border-slate-800">
        <h2 className="text-xl font-bold text-slate-200">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Apenas o administrador da liga ({group.members.find(m => m.id === group.adminId)?.name}) pode ver este painel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-amber-500/10 text-slate-200 rounded-xl p-6 shadow-sm border border-amber-500/20">
        <h2 className="text-xl font-black mb-2 flex items-center text-amber-400"><span className="mr-2">⚡</span> Painel de Admin</h2>
        <p className="text-slate-400 text-sm font-medium">
          Como administrador, você deve inserir os resultados reais após o término de cada partida.
          O sistema calculará automaticamente a pontuação de todos da liga.
        </p>
        
        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Renomear Liga</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newGroupName} 
              onChange={e => setNewGroupName(e.target.value)} 
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-4 py-2 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            <button 
              onClick={handleUpdateName}
              disabled={isUpdatingName || newGroupName.trim() === group.name || !newGroupName.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {isUpdatingName ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {nameUpdateMessage && <p className="text-amber-400 text-xs mt-2 font-medium">{nameUpdateMessage}</p>}
        </div>
      </div>

      {pendingMatches.length === 0 ? (
        <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-wider text-sm bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
          Nenhum jogo pendente
        </div>
      ) : (
        Object.entries(
          pendingMatches.reduce((acc, match) => {
            if (!acc[match.phase]) acc[match.phase] = [];
            acc[match.phase].push(match);
            return acc;
          }, {} as Record<string, Match[]>)
        )
        .sort((a,b) => {
           // Sort by earliest match date within the phase
           const minA = Math.min(...a[1].map(m => new Date(m.date).getTime()));
           const minB = Math.min(...b[1].map(m => new Date(m.date).getTime()));
           return minA - minB;
        })
        .map(([phase, phaseMatches]) => {
          const sortedPhaseMatches = [...phaseMatches].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return (
          <div key={phase} className="space-y-4">
            <h3 className="text-amber-400 font-black tracking-widest uppercase mb-2 mt-6 pl-3 border-l-4 border-amber-500 text-sm bg-slate-900/50 py-2 rounded-r-xl">
              {phase}
            </h3>
            {sortedPhaseMatches.map((match) => (
              <AdminMatchCard key={match.id} match={match} groupId={group.id} onComplete={onUpdate} />
            ))}
          </div>
          );
        })
      )}
    </div>
  );
}

function AdminMatchCard({ match, groupId, onComplete }: { match: Match, groupId: string, onComplete: () => void, key?: React.Key }) {
  const [realA, setRealA] = useState('');
  const [realB, setRealB] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleFinish = async () => {
    const a = parseInt(realA);
    const b = parseInt(realB);
    if (isNaN(a) || isNaN(b)) return;

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsFinishing(true);
    await dbService.finishMatch(match.id, a, b, groupId);
    setIsFinishing(false);
    onComplete();
  };

  return (
    <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden transition-all hover:border-slate-700">
      <div className="bg-amber-500/10 text-amber-400 border-b border-amber-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider">
        Finalizar Jogo: {formatDate(match.date)}
      </div>
      <div className="p-5 flex flex-col items-center">
        <div className="flex items-center justify-center w-full gap-4">
          <div className="flex flex-col items-center flex-1">
            {match.teamAFlagCode ? (
              <img src={`https://flagcdn.com/${match.teamAFlagCode}.svg`} alt={match.teamA} className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded shadow-sm border border-slate-700/50 mb-2 drop-shadow-md" />
            ) : (
              <div className="w-10 h-7 sm:w-12 sm:h-8 bg-slate-800 rounded flex items-center justify-center mb-2 border border-slate-700"><span className="text-xl">⚽</span></div>
            )}
            <span className="font-bold text-slate-200 uppercase tracking-wide text-sm text-center">{match.teamA}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="number" min="0" placeholder="-"
              value={realA} onChange={e => { setRealA(e.target.value); setShowConfirm(false); }}
              className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-slate-100 placeholder:text-slate-700"
            />
            <span className="font-black text-slate-600 text-lg">X</span>
            <input 
              type="number" min="0" placeholder="-"
              value={realB} onChange={e => { setRealB(e.target.value); setShowConfirm(false); }}
              className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-slate-100 placeholder:text-slate-700"
            />
          </div>

          <div className="flex flex-col items-center flex-1">
            {match.teamBFlagCode ? (
              <img src={`https://flagcdn.com/${match.teamBFlagCode}.svg`} alt={match.teamB} className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded shadow-sm border border-slate-700/50 mb-2 drop-shadow-md" />
            ) : (
              <div className="w-10 h-7 sm:w-12 sm:h-8 bg-slate-800 rounded flex items-center justify-center mb-2 border border-slate-700"><span className="text-xl">⚽</span></div>
            )}
            <span className="font-bold text-slate-200 uppercase tracking-wide text-sm text-center">{match.teamB}</span>
          </div>
        </div>
        
        <button 
          onClick={handleFinish}
          disabled={isFinishing || realA === '' || realB === ''}
          className={`mt-6 w-full ${showConfirm ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'} disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black tracking-wider uppercase py-4 rounded-xl disabled:shadow-none transition-colors`}
        >
          {isFinishing ? 'Processando...' : showConfirm ? 'Tem certeza?' : 'Confirmar Resultado Oficial'}
        </button>
      </div>
    </div>
  )
}
