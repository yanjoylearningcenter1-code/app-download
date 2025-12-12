import React, { useState, useEffect } from 'react';
import { SpeedReading } from './components/SpeedReading';
import { WordSetup } from './components/WordSetup';
import { Button } from './components/Button';
import { ProgressGraph } from './components/ProgressGraph';
import { defaultSets } from './data';
import { WordSets } from './types';
import { BookOpen, Edit, Download } from 'lucide-react';

type AppMode = 'HOME' | 'GAME_DEFAULT' | 'GAME_CUSTOM_SETUP' | 'GAME_CUSTOM_PLAY';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [customSets, setCustomSets] = useState<WordSets | null>(null);
  const [coins, setCoins] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleEarnCoins = (amount: number) => {
    setCoins(prev => prev + amount);
  };

  const renderContent = () => {
    switch (mode) {
      case 'HOME':
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-6 animate-in zoom-in duration-300 max-w-lg mx-auto">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-[#FFB347] rounded-3xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
                <Bomb className="w-12 h-12 text-white" size={48} />
              </div>
              <h1 className="text-4xl font-bold text-[#5D4037] kaiti">智能拆彈速讀</h1>
              <p className="text-gray-500">鬥快讀字，拆解炸彈，學習生字！</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <Button 
                onClick={() => setMode('GAME_DEFAULT')} 
                className="w-full" 
                size="lg"
              >
                <BookOpen className="w-5 h-5" />
                開始預設關卡
              </Button>
              
              <Button 
                onClick={() => setMode('GAME_CUSTOM_SETUP')} 
                variant="secondary" 
                className="w-full" 
                size="lg"
              >
                <Edit className="w-5 h-5" />
                自訂 / 拍照出題
              </Button>

              {deferredPrompt && (
                <Button 
                  onClick={handleInstallClick}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  下載 App (安裝到主畫面)
                </Button>
              )}
            </div>
            
            <div className="bg-[#FFF8E1] px-4 py-2 rounded-full text-[#F57C00] font-bold text-sm border border-[#FFE0B2]">
              🪙 金幣: {coins}
            </div>

            {/* Added Graph Here */}
            <ProgressGraph />
          </div>
        );

      case 'GAME_DEFAULT':
        return (
          <SpeedReading 
            sets={defaultSets} 
            onBack={() => setMode('HOME')} 
            onEarnCoins={handleEarnCoins} 
          />
        );

      case 'GAME_CUSTOM_SETUP':
        return (
          <WordSetup 
            onCancel={() => setMode('HOME')}
            onConfirm={(sets) => {
              setCustomSets(sets);
              setMode('GAME_CUSTOM_PLAY');
            }}
          />
        );

      case 'GAME_CUSTOM_PLAY':
        return (
          <SpeedReading 
            sets={customSets || defaultSets} 
            onBack={() => setMode('HOME')} 
            onEarnCoins={handleEarnCoins} 
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-800 pb-10">
      {renderContent()}
    </div>
  );
};

// Lucide icon helper for the home screen
const Bomb = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="11" cy="13" r="9" />
    <path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95" />
    <path d="m22 2-1.5 1.5" />
  </svg>
);

export default App;