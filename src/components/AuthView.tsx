import React, { useState } from 'react';
import { User, Group } from '../types';
import { dbService, dbId } from '../services/db';
import { Trophy, ArrowRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/logo.png';

interface AuthViewProps {
  onLogin: (user: User, group: Group) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [mode, setMode] = useState<'choose' | 'join' | 'create'>('choose');
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    try {
      const user: User = { id: dbId(), name: name.trim() };
      const group = await dbService.joinGroup(user, code);
      onLogin(user, group);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupName.trim()) return;
    try {
      const user: User = { id: dbId(), name: name.trim() };
      const group = await dbService.createGroup(user, groupName.trim());
      onLogin(user, group);
    } catch (err: any) {
      setError('Erro ao criar liga.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden text-slate-200"
      >
        <div className="bg-slate-900 p-8 text-center text-white border-b border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-3xl z-0"></div>
          <div className="relative z-10">
            <img src={logo} alt="Logo Bolão 2026" className="mx-auto h-24 object-contain mb-4 drop-shadow-xl" referrerPolicy="no-referrer" />
            <h1 className="text-3xl font-black tracking-tighter uppercase">Bolão da Copa</h1>
            <p className="text-slate-400 mt-2 font-medium tracking-wide">Faça seus palpites e vença seus amigos.</p>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 text-red-400 text-sm rounded-xl font-bold border border-red-500/20 text-center">
              {error}
            </div>
          )}

          {mode === 'choose' && (
            <div className="space-y-4">
              <button 
                onClick={() => setMode('join')}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 shadow-sm"
              >
                <span className="font-bold text-slate-200">Entrar em uma Liga</span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </button>
              <button 
                onClick={() => setMode('create')}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/30 shadow-sm"
              >
                <span className="font-bold text-emerald-400">Criar Nova Liga</span>
                <Plus className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Seu Nome</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-slate-700 bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-100 placeholder:text-slate-600 font-bold"
                  placeholder="Ex: João Silva" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Código da Liga (6 dígitos)</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-slate-700 bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all uppercase text-slate-100 placeholder:text-slate-600 font-bold"
                  placeholder="A1B2C3" required maxLength={6}
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-wider uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-colors mt-2">
                Entrar na Liga
              </button>
              <button type="button" onClick={() => setMode('choose')} className="w-full text-slate-500 font-bold text-sm mt-4 hover:text-slate-300 uppercase tracking-widest">
                Voltar
              </button>
            </form>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Seu Nome</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-slate-700 bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-100 placeholder:text-slate-600 font-bold"
                  placeholder="Ex: João Silva" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Nome da Liga</label>
                <input 
                  type="text" 
                  value={groupName} 
                  onChange={e => setGroupName(e.target.value)} 
                  className="w-full p-4 rounded-xl border border-slate-700 bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-100 placeholder:text-slate-600 font-bold"
                  placeholder="Sexta Cerveja Bolão" required
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-wider uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-colors mt-2">
                Criar Liga
              </button>
              <button type="button" onClick={() => setMode('choose')} className="w-full text-slate-500 font-bold text-sm mt-4 hover:text-slate-300 uppercase tracking-widest">
                Voltar
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
