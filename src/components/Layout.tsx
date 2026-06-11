import React from 'react';
import { Trophy, Users, ShieldAlert, LogOut, Copy, Check, User as UserIcon, List, Palette } from 'lucide-react';
import { Group, User } from '../types';
import logo from '../assets/logo.png';
import { Match } from '../types';

export function Layout({ 
  children, 
  activeTab, 
  onTabChange, 
  user, 
  group,
  matches,
  onLogout,
  onThemeToggle
}: { 
  children: React.ReactNode, 
  activeTab: 'predictions' | 'leaderboard' | 'admin' | 'profile' | 'groups', 
  onTabChange: (tab: any) => void,
  user: User,
  group: Group,
  matches: Match[],
  onLogout: () => void,
  onThemeToggle?: () => void
}) {
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTeamFlag = (teamName?: string) => {
    if (!teamName) return null;
    const match = matches.find(m => m.teamA === teamName || m.teamB === teamName);
    if (!match) return null;
    return match.teamA === teamName ? match.teamAFlagCode : match.teamBFlagCode;
  };
  const favFlag = getTeamFlag(user.favoriteTeam);

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-950 flex flex-col relative text-slate-100 border-x border-slate-900 shadow-2xl">
      <header className="py-4 px-6 bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Logo Bolão 2026" className="w-10 h-10 object-contain drop-shadow-md" referrerPolicy="no-referrer" />
            <h1 className="text-xl font-black tracking-tighter uppercase hidden sm:block">Bolão 2026</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2 bg-slate-950/50 rounded-full pl-1.5 pr-3 py-1 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden relative border border-slate-700 flex-shrink-0">
                {favFlag ? (
                  <img src={`https://flagcdn.com/${favFlag}.svg`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-300 truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
            </div>
            
            {onThemeToggle && (
              <button onClick={onThemeToggle} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hidden sm:block" title="Alternar Tema">
                <Palette className="w-5 h-5 text-emerald-400" />
              </button>
            )}
            
            <button onClick={onLogout} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700" title="Sair">
              <LogOut className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-xl p-3 flex justify-between items-center border border-slate-800">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Liga Atual</p>
            <p className="font-bold text-emerald-400 text-sm">{group.name} <span className="text-slate-500 ml-1">({group.members.length} membros)</span></p>
          </div>
          <button 
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors font-mono font-bold text-slate-200 text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}
            {group.code}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 pb-28">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe z-20">
        <div className="max-w-2xl mx-auto flex h-16">
          <NavItem 
            active={activeTab === 'predictions'} 
            onClick={() => onTabChange('predictions')}
            icon={<Trophy className="w-5 h-5 flex-shrink-0" />}
            label="Palpites"
          />
          <NavItem 
            active={activeTab === 'leaderboard'} 
            onClick={() => onTabChange('leaderboard')}
            icon={<Users className="w-5 h-5 flex-shrink-0" />}
            label="Ranking"
          />
          <NavItem 
            active={activeTab === 'groups'} 
            onClick={() => onTabChange('groups')}
            icon={<List className="w-5 h-5 flex-shrink-0" />}
            label="Ligas"
          />
          <NavItem 
            active={activeTab === 'profile'} 
            onClick={() => onTabChange('profile')}
            icon={<UserIcon className="w-5 h-5 flex-shrink-0" />}
            label="Perfil"
          />
          {user.id === group.adminId && (
            <NavItem 
              active={activeTab === 'admin'} 
              onClick={() => onTabChange('admin')}
              icon={<ShieldAlert className="w-5 h-5 flex-shrink-0" />}
              label="Admin"
              isAmber={true}
            />
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, isAmber = false }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isAmber?: boolean }) {
  const activeColor = isAmber ? 'text-amber-400 border-amber-500' : 'text-emerald-400 border-emerald-500';
  const activeIconColor = isAmber ? 'text-amber-400' : 'text-emerald-400';
  
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center border-t-2 transition-all ${
        active 
          ? `${activeColor} bg-slate-800/50` 
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
      }`}
    >
      <div className={`mb-1 ${active ? activeIconColor : 'text-slate-500'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
