import React, { useEffect, useState } from 'react';
import { User, Group } from '../types';
import { dbService } from '../services/db';
import { List, Plus, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function GroupsTab({ 
  user,
  currentGroup,
  onGroupSelect,
}: { 
  user: User;
  currentGroup: Group;
  onGroupSelect: (g: Group) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'join' | 'create'>('list');
  
  const [joinCode, setJoinCode] = useState('');
  const [createName, setCreateName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const g = await dbService.getUserGroups(user);
      setGroups(g);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!joinCode.trim()) return;
    try {
      const group = await dbService.joinGroup(user, joinCode);
      onGroupSelect(group);
      setMode('list');
      loadGroups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!createName.trim()) return;
    try {
      const group = await dbService.createGroup(user, createName.trim());
      onGroupSelect(group);
      setMode('list');
      loadGroups();
    } catch (err: any) {
      setError('Erro ao criar liga.');
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-10">Carregando ligas...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <List className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">Minhas Ligas</h1>
          <p className="text-sm text-slate-400 font-medium">Participe de outros grupos do bolão</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {groups.map(g => {
              const isAdmin = g.adminId === user.id;
              const isCurrent = g.id === currentGroup.id;
              
              return (
                <div 
                  key={g.id} 
                  className={`p-5 rounded-2xl border transition-all ${isCurrent ? 'bg-emerald-950/30 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-slate-900 border-slate-800 hover:border-slate-700'} flex items-center justify-between`}
                >
                  <div>
                    <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
                      {g.name}
                      {isAdmin && <span className="text-[9px] uppercase font-black bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">Admin</span>}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Código: <span className="text-slate-300 font-bold">{g.code}</span> • {g.members.length} membros</p>
                  </div>
                  
                  {isCurrent ? (
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      Atual
                    </span>
                  ) : (
                    <button 
                      onClick={() => onGroupSelect(g)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg transition-colors border border-slate-700"
                    >
                      Acessar
                    </button>
                  )}
                </div>
              );
            })}

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button 
                onClick={() => setMode('join')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-800 border-dashed group"
              >
                <ArrowRight className="w-6 h-6 text-slate-400 mb-2 group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Entrar em Liga</span>
              </button>
              <button 
                onClick={() => setMode('create')}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-800 border-dashed group"
              >
                <Plus className="w-6 h-6 text-slate-400 mb-2 group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Criar Liga</span>
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div 
            key="join"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-200 uppercase tracking-wide">Entrar em uma Liga</h2>
              <button onClick={() => setMode('list')} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {error && <div className="mb-4 p-3 bg-red-950/50 text-red-400 text-sm rounded-lg font-bold border border-red-500/20">{error}</div>}
            
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Código da Liga</label>
                <input 
                  type="text" 
                  value={joinCode} 
                  onChange={e => setJoinCode(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-semibold rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
                  placeholder="EX: A1B2C3" required maxLength={6}
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg py-3 shadow-lg shadow-emerald-500/20 transition-all">
                Entrar
              </button>
            </form>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-200 uppercase tracking-wide">Criar Nova Liga</h2>
              <button onClick={() => setMode('list')} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {error && <div className="mb-4 p-3 bg-red-950/50 text-red-400 text-sm rounded-lg font-bold border border-red-500/20">{error}</div>}
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Nome da Liga</label>
                <input 
                  type="text" 
                  value={createName} 
                  onChange={e => setCreateName(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-semibold rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ex: Galerinha do Trabalho" required
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg py-3 shadow-lg shadow-emerald-500/20 transition-all">
                Criar Liga
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
