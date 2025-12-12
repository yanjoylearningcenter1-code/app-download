import React, { useState, useEffect } from 'react';
import { WordSets, DifficultySet } from '../types';
import { Button } from './Button';
import { playSound, speak } from '../services/audio';
import { Play, Pause, RefreshCw, Timer, Bomb, Check, Home, Bell, Calendar } from 'lucide-react';
import { downloadCalendarReminder, saveLevelProgress, getProgress, getNextReviewIntervalLabel } from '../services/reminderService';

interface SpeedReadingProps {
  sets: WordSets;
  onBack: () => void;
  onEarnCoins: (amount: number) => void;
}

export const SpeedReading: React.FC<SpeedReadingProps> = ({ sets, onBack, onEarnCoins }) => {
  const [grid, setGrid] = useState<{word: string, defused: boolean}[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [currentSet, setCurrentSet] = useState<DifficultySet>('A');
  const [gameOver, setGameOver] = useState(false);
  // Store current stage to display correct reminder label
  const [currentStage, setCurrentStage] = useState(0);

  // When the selected set changes, regenerate the grid
  useEffect(() => {
    generateGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSet, sets]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && !gameOver) {
      interval = setInterval(() => {
        setTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver]);

  const generateGrid = () => {
    const sourceWords = sets[currentSet];
    // Create up to 20 items. If source is small, repeat items or limit grid size.
    let itemsToUse = sourceWords;
    if (itemsToUse.length === 0) {
        // Fallback for empty sets
        itemsToUse = ["無", "字詞", "請", "新增"];
    }

    const newGrid = Array.from({ length: 20 }, (_, i) => ({
        word: itemsToUse[i % itemsToUse.length], 
        defused: false
    }));
    
    // Shuffle the grid for randomness
    for (let i = newGrid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newGrid[i], newGrid[j]] = [newGrid[j], newGrid[i]];
    }

    setGrid(newGrid);
    setTime(0);
    setIsRunning(false);
    setGameOver(false);
    speak("準備好未？點擊炸彈來拆解佢哋！");
    
    // Fetch current progress to know what stage we are at for this set
    const p = getProgress();
    setCurrentStage(p[currentSet].stage);
  };

  const toggleTimer = () => {
    if (!isRunning) {
      playSound('click');
      setIsRunning(true);
      if (time === 0) speak("開始！");
    } else {
      setIsRunning(false);
    }
  };

  const handleWordClick = (index: number) => {
    if (grid[index].defused) return;
    
    // Logic: User reads it, clicks it, we speak it to confirm, and it "defuses"
    playSound('defuse'); // Snip sound
    speak(grid[index].word);
    
    const newGrid = [...grid];
    newGrid[index].defused = true;
    setGrid(newGrid);

    // Check win condition
    if (newGrid.every(item => item.defused)) {
        setGameOver(true);
        setIsRunning(false);
        playSound('win');
        onEarnCoins(20); 
        
        // Save progress to localStorage for the graph
        saveLevelProgress(currentSet);
        
        // Refresh stage for UI
        const p = getProgress();
        setCurrentStage(p[currentSet].stage);

        setTimeout(() => speak(`任務完成！用咗${time.toFixed(1)}秒，獲得20金幣！`), 1000);
    }
  };

  const handleSetReminder = () => {
    // Triggers .ics download. On iPad, this asks to add to Calendar.
    downloadCalendarReminder(currentSet, currentStage); 
  };
  
  const reminderLabel = getNextReviewIntervalLabel(currentStage);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
             <Home className="w-4 h-4 mr-1"/> 離開
        </Button>
        <div className="flex gap-2">
             {(['A', 'B', 'C'] as const).map(set => (
                 <button 
                    key={set}
                    onClick={() => setCurrentSet(set)}
                    className={`w-12 h-12 rounded-2xl font-bold text-xl transition-all ${currentSet === set ? 'bg-[#FFB347] text-white scale-110 shadow-md' : 'bg-white text-gray-500 border-2 border-gray-100 hover:bg-gray-50'}`}
                 >
                    {set}
                 </button>
             ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-[#E0E0E0] flex justify-between items-center mb-4 relative overflow-hidden">
         <div className={`flex items-center gap-2 text-3xl font-mono ${gameOver ? 'text-green-600' : 'text-[#D84315]'}`}>
            <Timer className={isRunning ? 'animate-spin' : ''} />
            {time.toFixed(1)}s
         </div>
         
         <div className="flex gap-2">
             {!gameOver && (
                <Button size="sm" variant={isRunning ? "secondary" : "primary"} onClick={toggleTimer} className={isRunning ? '' : 'animate-pulse'}>
                    {isRunning ? <Pause /> : <Play />}
                </Button>
             )}
             <Button size="sm" variant="outline" onClick={generateGrid}>
                <RefreshCw />
             </Button>
         </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 bg-[#3E2723]/5 rounded-xl p-3 grid grid-cols-4 gap-3 md:gap-4 content-start overflow-y-auto min-h-[400px]">
          {grid.map((item, i) => (
              <button 
                key={i}
                onClick={() => handleWordClick(i)}
                disabled={item.defused || (!isRunning && !gameOver && time === 0)}
                className={`
                    relative aspect-[4/3] md:aspect-square flex flex-col items-center justify-center rounded-xl border-b-4 
                    transition-all duration-200 select-none touch-manipulation
                    ${item.defused 
                        ? 'bg-[#E0E0E0] border-[#BDBDBD] opacity-60 scale-95 cursor-default' 
                        : 'bg-white border-[#8D6E63] shadow-sm active:scale-95 active:border-b-0 active:translate-y-1 hover:bg-[#FFF3E0] cursor-pointer'
                    }
                `}
              >
                {/* Visuals */}
                {item.defused ? (
                    <Check className="text-green-500 w-8 h-8 md:w-12 md:h-12" />
                ) : (
                    <Bomb className="text-red-400 w-6 h-6 md:w-8 md:h-8 mb-1" />
                )}
                
                <span className={`text-lg md:text-2xl font-bold kaiti text-center px-1 break-words leading-tight ${item.defused ? 'text-gray-400 line-through' : 'text-[#3E2723]'}`}>
                    {item.word}
                </span>
              </button>
          ))}
      </div>
      
      {/* Game Over Overlay */}
      {gameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-4 border-[#AED581] animate-in zoom-in duration-300 text-center max-w-sm w-full">
                  <h2 className="text-4xl font-bold text-[#33691E] kaiti mb-2">拆解成功!</h2>
                  <p className="text-xl mb-6 text-gray-600">用時: {time.toFixed(1)} 秒</p>
                  
                  <div className="space-y-3">
                    <Button 
                      variant="primary" 
                      className="w-full bg-[#33691E] hover:bg-[#558B2F] border-b-4 border-[#1B5E20] active:border-b-0" 
                      onClick={handleSetReminder}
                    >
                      <Calendar className="w-5 h-5" />
                      {reminderLabel}後 溫習提醒
                    </Button>
                    <p className="text-xs text-gray-400">根據遺忘曲線，{reminderLabel}後溫習最有效！</p>
                    
                    <div className="pt-4 border-t border-gray-100 mt-4">
                       <Button variant="outline" className="w-full" onClick={generateGrid}>
                         <RefreshCw className="w-4 h-4" /> 再玩一次
                       </Button>
                    </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};