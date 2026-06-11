import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Check } from 'lucide-react';

interface TutorialStep {
  tab: 'predictions' | 'leaderboard' | 'groups' | 'profile';
  title: string;
  description: string;
}

const steps: TutorialStep[] = [
  {
    tab: 'predictions',
    title: 'Bem-vindo ao Bolão! ⚽',
    description: 'Aqui na aba Palpites você registra todas as suas previsões para os jogos. Tente acertar o placar exato para fazer mais pontos! Lembre-se, palpites são bloqueados na hora em que o jogo começa.'
  },
  {
    tab: 'leaderboard',
    title: 'O Ranking 🏆',
    description: 'Nesta aba você visualiza sua posição na liga em relação aos outros membros. Acompanhe subidas e descidas após cada rodada finalizada!'
  },
  {
    tab: 'groups',
    title: 'Suas Ligas 👥',
    description: 'Participe de várias ligas! Aqui você pode alternar facilmente entre elas, criar novos grupos ou entrar em um usando um código de convite.'
  },
  {
    tab: 'groups',
    title: 'Convide seus amigos 🔗',
    description: 'No topo da tela, você sempre verá o nome da liga atual e o código (ex: A1B2C3). Clique nele para copiar e compartilhar com seus amigos!'
  },
  {
    tab: 'profile',
    title: 'Seu Perfil 👤',
    description: 'Por fim, personalize sua experiência! Escolha sua seleção favorita, altere seu nome de exibição e brinque com os temas visuais do aplicativo.'
  }
];

export function TutorialOverlay({ 
  onTabChange, 
  onComplete 
}: { 
  onTabChange: (tab: any) => void;
  onComplete: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    onTabChange(steps[currentStepIndex].tab);
  }, [currentStepIndex, onTabChange]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center sm:justify-end sm:items-end p-4 pb-24 sm:p-8">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 rounded-2xl p-6 max-w-sm w-full pointer-events-auto relative z-10"
        >
          <div className="flex items-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i === currentStepIndex ? 'bg-emerald-400' : i < currentStepIndex ? 'bg-emerald-400/30' : 'bg-slate-800'}`} 
              />
            ))}
          </div>
          
          <h3 className="text-xl font-black text-slate-100 mb-2">{step.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
            {step.description}
          </p>

          <div className="flex justify-between items-center mt-auto">
            <button 
              onClick={onComplete}
              className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors"
            >
              Pular Tutorial
            </button>
            
            <button 
              onClick={handleNext}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform transform active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>Concluído <Check className="w-5 h-5" /></>
              ) : (
                <>Próximo <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
