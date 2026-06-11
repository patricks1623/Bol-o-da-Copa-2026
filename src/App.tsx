import React, { useState, useEffect } from 'react';
import { User, Group, Match } from './types';
import { dbService } from './services/db';
import { AuthView } from './components/AuthView';
import { Layout } from './components/Layout';
import { PredictionsTab } from './components/PredictionsTab';
import { LeaderboardTab } from './components/LeaderboardTab';
import { AdminTab } from './components/AdminTab';
import { ProfileTab } from './components/ProfileTab';
import { GroupsTab } from './components/GroupsTab';
import { TutorialOverlay } from './components/TutorialOverlay';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'predictions' | 'leaderboard' | 'admin' | 'profile' | 'groups'>('predictions');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Carrega matches na inicialização se ainda não ouviu
    loadMatches();
    
    let unsubMatches: (() => void) | undefined;
    let unsubGroup: (() => void) | undefined;

    // Usamos localStorage para manter a sessão, permitindo que a progressão não se perca ao fechar o site
    const savedUser = localStorage.getItem('bolao_user');
    const savedGroup = localStorage.getItem('bolao_group');
    if (savedUser && savedGroup) {
      const u = JSON.parse(savedUser);
      const g = JSON.parse(savedGroup);
      setUser(u);
      setGroup(g);
    }

    unsubMatches = dbService.listenMatches((m) => {
      setMatches(m);
      window.dispatchEvent(new CustomEvent('bolao_score_updated'));
    });

    return () => {
      if (unsubMatches) unsubMatches();
    };
  }, []);

  useEffect(() => {
    if (!group) return;
    const unsubGroup = dbService.listenGroup(group.id, (updatedGroup) => {
      setGroup(updatedGroup);
      localStorage.setItem('bolao_group', JSON.stringify(updatedGroup));
    });
    return () => unsubGroup();
  }, [group?.id]);

  useEffect(() => {
    if (user?.theme) {
      document.documentElement.className = user.theme !== 'default' ? `theme-${user.theme}` : '';
    } else {
      document.documentElement.className = '';
    }
  }, [user?.theme]);

  useEffect(() => {
    if (user && group) {
      const tutorialDone = localStorage.getItem('bolao_tutorial_done_v1');
      if (!tutorialDone) {
        setShowTutorial(true);
      }
    }
  }, [user, group]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('bolao_tutorial_done_v1', 'true');
    setActiveTab('predictions');
  };

  const loadMatches = async () => {
    const data = await dbService.getMatches();
    setMatches(data);
  };

  const handleLogin = (newUser: User, newGroup: Group) => {
    setUser(newUser);
    setGroup(newGroup);
    localStorage.setItem('bolao_user', JSON.stringify(newUser));
    localStorage.setItem('bolao_group', JSON.stringify(newGroup));
  };

  const handleLogout = () => {
    setUser(null);
    setGroup(null);
    localStorage.removeItem('bolao_user');
    localStorage.removeItem('bolao_group');
    setActiveTab('predictions');
  };

  const handleThemeToggle = async () => {
    if (!user || !group) return;
    const themes = ['default', 'classic'];
    const currentIndex = themes.indexOf(user.theme || 'default');
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    const updatedUser = { ...user, theme: nextTheme };
    setUser(updatedUser);
    localStorage.setItem('bolao_user', JSON.stringify(updatedUser));
    
    try {
      await dbService.updateUserProfile(group.id, updatedUser);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminUpdate = async () => {
    await loadMatches();
    // Em um app real com Firebase/Supabase, usaríamos listeners/webhooks (onSnapshot).
    // Para simplificar a recarga manual ao final do jogo:
    window.dispatchEvent(new CustomEvent('bolao_score_updated')); 
  };

  if (!user || !group) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      group={group}
      matches={matches}
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onLogout={handleLogout}
      onThemeToggle={handleThemeToggle}
    >
      {activeTab === 'predictions' && (
        <PredictionsTab user={user} group={group} matches={matches} />
      )}
      {activeTab === 'leaderboard' && (
        <LeaderboardTab group={group} matches={matches} />
      )}
      {activeTab === 'admin' && (
        <AdminTab user={user} group={group} matches={matches} onUpdate={handleAdminUpdate} />
      )}
      {activeTab === 'profile' && (
        <ProfileTab user={user} group={group} matches={matches} onUserUpdate={(u) => {
          setUser(u);
          localStorage.setItem('bolao_user', JSON.stringify(u));
        }} />
      )}
      {activeTab === 'groups' && (
        <GroupsTab 
          user={user} 
          currentGroup={group} 
          onGroupSelect={(g) => {
            setGroup(g);
            localStorage.setItem('bolao_group', JSON.stringify(g));
            setActiveTab('predictions');
          }} 
        />
      )}
      {showTutorial && (
        <TutorialOverlay 
          onTabChange={setActiveTab}
          onComplete={handleTutorialComplete}
        />
      )}
    </Layout>
  );
}
