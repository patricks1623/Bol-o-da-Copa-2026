import React, { useState, useEffect, useRef } from 'react';
import { Match, Prediction, User, Group } from '../types';
import { isMatchLocked, formatDate } from '../utils';
import { dbService } from '../services/db';
import { CheckCircle2, Lock, Plus, Minus, Filter, X, Users } from 'lucide-react';
import { motion } from 'motion/react';

export function PredictionsTab({ user, group, matches }: { user: User, group: Group, matches: Match[] }) {
  const [tabMode, setTabMode] = useState<'jogos' | 'bonus'>('jogos');
  
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [bonusData, setBonusData] = useState({ champion: '', topScorer: '' });
  const [bonusStatus, setBonusStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [filterTeam, setFilterTeam] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedMatchPreds, setSelectedMatchPreds] = useState<Prediction[]>([]);
  const [loadingOthers, setLoadingOthers] = useState(false);

  const handleViewOthers = async (match: Match) => {
    setSelectedMatch(match);
    setLoadingOthers(true);
    try {
      const allPreds = await dbService.getGroupPredictions(group.id);
      const matchPreds = allPreds.filter(p => p.matchId === match.id);
      setSelectedMatchPreds(matchPreds);
    } finally {
      setLoadingOthers(false);
    }
  };

  useEffect(() => {
    if (matches.length > 0 && !isInitialized) {
      const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstPendingMatch = sortedMatches.find(m => m.status !== 'finished');
      
      if (firstPendingMatch) {
         setFilterPhase(firstPendingMatch.phase);
      } else {
         setFilterPhase(sortedMatches[sortedMatches.length - 1].phase);
      }
      setIsInitialized(true);
    }
  }, [matches, isInitialized]);

  useEffect(() => {
    loadMyPredictions();
    loadBonusPredictions();
  }, [user.id, group.id, matches]);

  const loadMyPredictions = async () => {
    const myPreds = await dbService.getMyPredictions(user.id, group.id);
    const predMap: Record<string, Prediction> = {};
    myPreds.forEach(p => predMap[p.matchId] = p);
    setPredictions(predMap);
  };
  
  const loadBonusPredictions = async () => {
    const data = await dbService.getBonusPrediction(user.id, group.id);
    setBonusData({ champion: data.champion || '', topScorer: data.topScorer || '' });
  };
  
  const handleSaveBonus = async () => {
    setBonusStatus('saving');
    try {
      await dbService.saveBonusPrediction(user.id, group.id, bonusData);
      setBonusStatus('saved');
      setTimeout(() => setBonusStatus('idle'), 3000);
    } catch(err) {
      console.error(err);
      setBonusStatus('idle');
    }
  };

  const handleScoreChange = (matchId: string, team: 'A' | 'B', val: string) => {
    let score: number | '' = '';
    if (val !== '') {
        const num = parseInt(val);
        score = isNaN(num) ? 0 : num;
    }
    
    setPredictions(prev => {
      const pred = prev[matchId] || { matchId, userId: user.id, groupId: group.id, scoreA: '', scoreB: '' };
      return {
        ...prev,
        [matchId]: {
          ...pred,
          [team === 'A' ? 'scoreA' : 'scoreB']: score
        } as Prediction
      };
    });
    
    setGlobalStatus('idle');
  };

  const handleSaveAll = async () => {
    setGlobalStatus('saving');
    
    const predsToSave = (Object.values(predictions) as Prediction[]).filter(p => {
      const match = matches.find(m => m.id === p.matchId);
      if (!match) return false;
      return !isMatchLocked(match.date) && match.status !== 'finished';
    });

    try {
      await Promise.all(
        predsToSave.map(async (pred) => {
          const tempPred = pred as any;
          const dbPred: Prediction = {
            ...pred,
            scoreA: tempPred.scoreA === '' ? 0 : tempPred.scoreA,
            scoreB: tempPred.scoreB === '' ? 0 : tempPred.scoreB,
          };
          await dbService.savePrediction(dbPred);
        })
      );
      setGlobalStatus('saved');
      setTimeout(() => setGlobalStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save predictions', err);
      setGlobalStatus('idle');
    }
  };

  const phaseOrder = Array.from(new Set(matches.map(m => m.phase))).sort((a, b) => {
    const minDateA = Math.min(...matches.filter(m => m.phase === a).map(m => new Date(m.date).getTime()));
    const minDateB = Math.min(...matches.filter(m => m.phase === b).map(m => new Date(m.date).getTime()));
    return minDateA - minDateB;
  });
  const phases = phaseOrder;
  
  const groupMatches = matches.filter(m => m.phase.includes('Grupos'));
  const teams = Array.from(new Set(groupMatches.flatMap(m => [m.teamA, m.teamB]))).sort();
  
  const groups = Array.from(new Set(matches.map(m => m.groupName).filter(Boolean))) as string[];
  groups.sort();

  const filteredMatches = matches.filter(match => {
    if (filterPhase && match.phase !== filterPhase) return false;
    if (filterGroup && match.groupName !== filterGroup) return false;
    if (filterTeam && match.teamA !== filterTeam && match.teamB !== filterTeam) return false;
    return true;
  });

  const groupedMatches = filteredMatches.reduce((acc, match) => {
    if (!acc[match.phase]) acc[match.phase] = [];
    acc[match.phase].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="space-y-10 pb-24">
      {/* Mode Switches */}
      <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-xl flex">
        <button 
          onClick={() => setTabMode('jogos')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${tabMode === 'jogos' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Jogos da Rodada
        </button>
        <button 
          onClick={() => setTabMode('bonus')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${tabMode === 'bonus' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Palpites Bônus
        </button>
      </div>

      {tabMode === 'jogos' ? (
        <>
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Filtros</h3>
          {(filterPhase || filterTeam || filterGroup) && (
            <button 
              onClick={() => { setFilterPhase(''); setFilterTeam(''); setFilterGroup(''); }}
              className="ml-auto flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select 
            value={filterPhase} 
            onChange={e => setFilterPhase(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
          >
            <option value="">Todas as Rodadas</option>
            {phases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          
          <select 
            value={filterGroup} 
            onChange={e => setFilterGroup(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none disabled:opacity-50"
            disabled={groups.length === 0}
          >
            <option value="">Todos os Grupos</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select 
            value={filterTeam} 
            onChange={e => setFilterTeam(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
          >
            <option value="">Todas as Seleções</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {phaseOrder.filter(phase => groupedMatches[phase]).map(phase => {
        const phaseMatches = groupedMatches[phase].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return (
        <div key={phase}>
          <h2 className="text-emerald-400 font-black tracking-widest uppercase mb-4 pl-3 border-l-4 border-emerald-500 text-sm md:text-base bg-slate-900/50 py-2 rounded-r-xl w-full">
            {phase}
          </h2>
          <div className="space-y-4">
            {phaseMatches.map(match => {
              const locked = isMatchLocked(match.date) || match.status === 'finished';
              const pred = predictions[match.id] || { scoreA: '', scoreB: '' };
              
              let cardStyle = "bg-slate-900 border-slate-800 hover:border-slate-700";
              let headerStyle = locked ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-800 border-b border-slate-800 text-slate-300';
              let pointBadgeStyle = "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

              if (match.status === 'finished') {
                const pts = pred.points ?? 0;
                if (pts === 3) {
                  cardStyle = "bg-emerald-950/20 border-emerald-500/30";
                  headerStyle = "bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-500/80";
                  pointBadgeStyle = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
                } else if (pts === 1) {
                  cardStyle = "bg-blue-950/20 border-blue-500/30";
                  headerStyle = "bg-blue-950/40 border-b border-blue-500/20 text-blue-500/80";
                  pointBadgeStyle = "border-blue-500/30 bg-blue-500/10 text-blue-400";
                } else {
                  cardStyle = "bg-slate-900/80 border-slate-800/80 shadow-none";
                  headerStyle = "bg-slate-900/50 border-b border-slate-800 text-slate-600";
                  pointBadgeStyle = "border-red-500/20 bg-red-500/5 text-red-400/80";
                }
              }

              return (
                <motion.div 
                  key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl shadow-sm border overflow-hidden transition-all ${cardStyle}`}
          >
            {/* Header / Info */}
            <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center ${headerStyle}`}>
              <span>{formatDate(match.date)}</span>
              {match.status === 'finished' ? (
                <span className="flex items-center gap-1 text-slate-400"><CheckCircle2 className="w-3 h-3"/> Finalizado</span>
              ) : locked ? (
                <span className="flex items-center gap-1 text-red-500/80" title="Palpites encerrados 5 min antes do jogo">
                  <Lock className="w-3 h-3"/> Bloqueado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Aberto
                </span>
              )}
            </div>

            {/* Teams & Inputs */}
            <div className="p-5 flex flex-col items-center">
              <div className="flex items-center justify-center w-full gap-4">
                
                {/* Team A */}
                <div className="flex flex-col items-center flex-1">
                  {match.teamAFlagCode ? (
                    <img src={`https://flagcdn.com/${match.teamAFlagCode}.svg`} alt={match.teamA} className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded shadow-sm border border-slate-700 mb-2 drop-shadow-md" />
                  ) : (
                    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-slate-800 rounded flex items-center justify-center mb-2 border border-slate-700"><span className="text-xl">⚽</span></div>
                  )}
                  <span className="font-bold text-slate-200 text-sm sm:text-base uppercase tracking-wide text-center">{match.teamA}</span>
                </div>

                {/* Score Inputs / Displays */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    {!locked && (
                      <button 
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'A', String(Math.min(20, (pred.scoreA === '' ? -1 : Number(pred.scoreA)) + 1)))}
                        className="w-10 h-8 sm:w-12 sm:h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex justify-center items-center active:bg-slate-600 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    <input 
                      type="number" min="0" max="20"
                      disabled={locked}
                      value={pred.scoreA}
                      onChange={(e) => handleScoreChange(match.id, 'A', e.target.value)}
                      className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:bg-slate-900 text-slate-100 placeholder:text-slate-700 shadow-inner"
                      placeholder="-"
                    />
                    {!locked && (
                      <button 
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'A', String(Math.max(0, (pred.scoreA === '' ? 1 : Number(pred.scoreA)) - 1)))}
                        className="w-10 h-8 sm:w-12 sm:h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex justify-center items-center active:bg-slate-600 transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <span className="font-black text-slate-600 text-lg">X</span>

                  <div className="flex flex-col items-center gap-2">
                    {!locked && (
                      <button 
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'B', String(Math.min(20, (pred.scoreB === '' ? -1 : Number(pred.scoreB)) + 1)))}
                        className="w-10 h-8 sm:w-12 sm:h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex justify-center items-center active:bg-slate-600 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    <input 
                      type="number" min="0" max="20"
                      disabled={locked}
                      value={pred.scoreB}
                      onChange={(e) => handleScoreChange(match.id, 'B', e.target.value)}
                      className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:bg-slate-900 text-slate-100 placeholder:text-slate-700 shadow-inner"
                      placeholder="-"
                    />
                    {!locked && (
                      <button 
                        type="button"
                        onClick={() => handleScoreChange(match.id, 'B', String(Math.max(0, (pred.scoreB === '' ? 1 : Number(pred.scoreB)) - 1)))}
                        className="w-10 h-8 sm:w-12 sm:h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex justify-center items-center active:bg-slate-600 transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center flex-1">
                  {match.teamBFlagCode ? (
                    <img src={`https://flagcdn.com/${match.teamBFlagCode}.svg`} alt={match.teamB} className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded shadow-sm border border-slate-700 mb-2 drop-shadow-md" />
                  ) : (
                    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-slate-800 rounded flex items-center justify-center mb-2 border border-slate-700"><span className="text-xl">⚽</span></div>
                  )}
                  <span className="font-bold text-slate-200 text-sm sm:text-base uppercase tracking-wide text-center">{match.teamB}</span>
                </div>
              </div>

              {/* Real Score Result if Finished */}
              {match.status === 'finished' && (
                <div className="mt-5 pt-4 border-t border-slate-800 w-full text-center">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Resultado Oficial</p>
                  <p className="text-xl font-black text-slate-200 mt-1">{match.realScoreA} <span className="text-slate-600 mx-2">X</span> {match.realScoreB}</p>
                  <div className={`mt-3 inline-flex items-center border px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all ${pointBadgeStyle}`}>
                    Pts Ganhos: <span className="text-lg ml-2">{pred.points !== undefined ? pred.points : 0}</span>
                  </div>
                </div>
              )}

              {/* View Others Predictions */}
              {locked && (
                <div className="mt-5 w-full">
                  <button 
                    onClick={() => handleViewOthers(match)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Palpites da Liga
                  </button>
                </div>
              )}
            </div>
          </motion.div>
              )
            })}
          </div>
        </div>
        );
      })}
      
      {/* Save Button */}
      <div className="mt-8 mb-4 px-4 flex justify-center w-full">
        <button
          onClick={handleSaveAll}
          disabled={globalStatus === 'saving'}
          className={`flex items-center justify-center gap-2 w-full max-w-sm py-4 rounded-xl font-black uppercase tracking-wider transition-all shadow-xl border ${
            globalStatus === 'saved' 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.3)]'
          }`}
        >
          {globalStatus === 'saving' ? (
             <><span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span> Salvando...</>
          ) : globalStatus === 'saved' ? (
             <><CheckCircle2 className="w-5 h-5" /> Salvo com Sucesso!</>
          ) : (
             'Salvar Todos os Palpites'
          )}
        </button>
      </div>

        </>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-black text-emerald-400 mb-6 uppercase tracking-widest text-center">Palpites Extras</h2>
          <p className="text-sm text-slate-400 text-center mb-8 font-medium">Preencha os palpites bônus. Esses dados valerão pontos extras ao final do torneio!</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Seleção Campeã</label>
              <select 
                value={bonusData.champion} 
                onChange={e => setBonusData(prev => ({ ...prev, champion: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none transition-all"
              >
                <option value="">Selecione uma Seleção</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Artilheiro (Nome do Jogador)</label>
              <input 
                type="text" 
                value={bonusData.topScorer} 
                onChange={e => setBonusData(prev => ({ ...prev, topScorer: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
                placeholder="Ex: Kylian Mbappé"
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSaveBonus}
              disabled={bonusStatus === 'saving'}
              className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black uppercase tracking-wider transition-all shadow-xl border ${
                bonusStatus === 'saved' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.3)]'
              }`}
            >
              {bonusStatus === 'saving' ? (
                 <><span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span> Salvando...</>
              ) : bonusStatus === 'saved' ? (
                 <><CheckCircle2 className="w-5 h-5" /> Salvo com Sucesso!</>
              ) : (
                 'Salvar Bônus'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Others Predictions Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 sm:rounded-2xl rounded-t-3xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur">
              <div>
                <h3 className="font-black text-slate-200">Palpites da Liga</h3>
                <p className="text-xs text-emerald-400 font-bold tracking-wider uppercase mt-1">
                  {selectedMatch.teamA} x {selectedMatch.teamB}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMatch(null)} 
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {loadingOthers ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                </div>
              ) : selectedMatchPreds.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <p>Nenhum palpite registrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMatchPreds
                    .sort((a, b) => {
                      // Sort by points mostly
                      if (a.points !== undefined && b.points !== undefined) return b.points - a.points;
                      return 0;
                    })
                    .map(p => {
                      const member = group.members.find(m => m.id === p.userId);
                      return (
                        <div key={p.userId} className="flex justify-between items-center p-3 sm:p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                              {member?.name.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-bold text-slate-300 text-sm">{member?.name || 'Membro desconhecido'}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-black text-slate-200 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                              {p.scoreA} <span className="text-slate-600 text-sm mx-1">x</span> {p.scoreB}
                            </span>
                            {p.points !== undefined && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                p.points === 3 ? 'bg-emerald-500/20 text-emerald-400' :
                                p.points === 1 ? 'bg-blue-500/20 text-blue-400' :
                                'bg-slate-800 text-slate-500'
                              }`}>
                                {p.points}pt
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
