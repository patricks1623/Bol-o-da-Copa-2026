import React, { useState } from 'react';
import { User, Group, Match } from '../types';
import { dbService } from '../services/db';
import { User as UserIcon, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export function ProfileTab({ 
  user, 
  group, 
  matches,
  onUserUpdate 
}: { 
  user: User; 
  group: Group; 
  matches: Match[];
  onUserUpdate: (u: User) => void;
}) {
  const [favoriteTeam, setFavoriteTeam] = useState<string>(user.favoriteTeam || '');
  const [name, setName] = useState<string>(user.name || '');
  const [theme, setTheme] = useState<string>(user.theme || 'default');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  React.useEffect(() => {
    if (user.theme) setTheme(user.theme);
  }, [user.theme]);

  // Load purely from group stage matches
  const groupMatchTeams = matches.filter(m => m.phase.includes('Grupos')).flatMap(m => [m.teamA, m.teamB]);
  let teams = Array.from(new Set(groupMatchTeams)).filter(t => t).sort();

  if (teams.length === 0) {
    // Fallback just in case
    teams = [
      "África do Sul", "Alemanha", "Arábia Saudita", "Argélia", "Argentina", "Austrália",
      "Bélgica", "Bósnia", "Brasil", "Cabo Verde", "Camarões", "Canadá", "Catar",
      "Chile", "Colômbia", "Congo DR", "Coreia do Norte", "Coreia do Sul",
      "Costa Rica", "Costa do Marfim", "Croácia", "Curaçao", "Dinamarca", "Egito",
      "Equador", "Escócia", "Espanha", "Estados Unidos", "EUA", "França", "Gana",
      "Haiti", "Holanda", "Inglaterra", "Iraque", "Irã", "Itália", "Japão",
      "Jordânia", "Marrocos", "México", "Nigéria", "Noruega", "Nova Zelândia",
      "Panamá", "Paraguai", "Peru", "Polônia", "Portugal", "RD Congo",
      "República Tcheca", "Senegal", "Suécia", "Suíça", "Tchéquia", "Tunísia",
      "Turquia", "Ucrânia", "Uruguai", "Uzbequistão"
    ];
  }

  const handleSave = async () => {
    if (!name.trim()) return;
    setStatus('saving');
    try {
      const updatedUser = { ...user, favoriteTeam, name: name.trim(), theme };
      await dbService.updateUserProfile(group.id, updatedUser);
      onUserUpdate(updatedUser);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  const getTeamFlag = (teamName: string) => {
    const match = matches.find(m => m.teamA === teamName || m.teamB === teamName);
    if (!match) return null;
    return match.teamA === teamName ? match.teamAFlagCode : match.teamBFlagCode;
  };

  const currentFlag = favoriteTeam ? getTeamFlag(favoriteTeam) : null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <UserIcon className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">Meu Perfil</h1>
          <p className="text-sm text-slate-400 font-medium">Personalize sua experiência</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
        
        <div className="space-y-6 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Nome de Exibição</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como quer ser chamado?"
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-2">Você pode alterar seu nome de exibição no ranking.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Seleção Favorita</label>
            <div className="relative">
              <select 
                value={favoriteTeam} 
                onChange={e => setFavoriteTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg pl-12 pr-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none transition-colors"
              >
                <option value="">Nenhuma seleção</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {currentFlag ? (
                  <img src={`https://flagcdn.com/${currentFlag}.svg`} alt={favoriteTeam} className="w-6 h-4 object-cover rounded shadow-sm" />
                ) : (
                  <div className="w-6 h-4 bg-slate-800 border border-slate-700 rounded text-[8px] flex items-center justify-center text-slate-500">?</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Tema Visual</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'default', name: 'Neon Purple', color1: '#1a013d', color2: '#BFF205' },
                { id: 'classic', name: 'Classic Dark', color1: '#020617', color2: '#10b981' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${theme === t.id ? 'border-emerald-500 bg-slate-800' : 'border-slate-800 bg-slate-900 opacity-60 hover:opacity-100 hover:border-slate-700'}`}
                >
                  <div className="w-8 h-8 rounded-full mb-2 flex overflow-hidden shadow border border-slate-700">
                    <div className="w-1/2 h-full" style={{ backgroundColor: t.color1 }}></div>
                    <div className="w-1/2 h-full" style={{ backgroundColor: t.color2 }}></div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-center text-slate-300">{t.name}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Sua cor preferida. (Pode demorar para refletir pela primeira vez)</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {status === 'saving' ? (
              <span className="animate-pulse">Salvando...</span>
            ) : status === 'saved' ? (
              <><CheckCircle2 className="w-4 h-4" /> Salvo</>
            ) : (
              <><Save className="w-4 h-4" /> Salvar Perfil</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
