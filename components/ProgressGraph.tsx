import React, { useEffect, useState } from 'react';
import { AllProgress, DifficultySet } from '../types';
import { getProgress, resetProgress, getNextReviewDate } from '../services/reminderService';
import { Button } from './Button';
import { Trash2, TrendingUp, Info, Clock } from 'lucide-react';

export const ProgressGraph: React.FC = () => {
  const [data, setData] = useState<AllProgress>(getProgress());
  const [selectedSet, setSelectedSet] = useState<DifficultySet>('A');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setData(getProgress());
  }, [tick]);

  const handleReset = () => {
    if (window.confirm('確定要重置所有學習進度嗎？(此操作無法復原)')) {
      resetProgress();
      setTick(t => t + 1);
    }
  };

  const width = 300;
  const height = 150;
  const padding = 20;
  
  const currentProgress = data[selectedSet];
  const lastPlayedTime = currentProgress.lastPlayed;
  const now = Date.now();
  
  // Stages correspond to: 20m, 1h, 9h, 1d, 2d, 6d
  // We approximate stability S (in days) roughly
  const sMap = [0.01, 0.04, 0.2, 0.5, 1.5, 3.5, 10]; 
  const S = sMap[Math.min(currentProgress.stage, 6)] || 0.01;

  // We show a 7-day window.
  const daysToShow = 7;
  const points: string[] = [];
  
  // Generate curve points
  for (let x = 0; x <= width - 2 * padding; x += 5) {
    const t = (x / (width - 2 * padding)) * daysToShow; 
    // Retention starts at 100% and decays
    let retention = 100 * Math.exp(-t / S);
    const y = (height - padding) - (retention / 100) * (height - 2 * padding);
    points.push(`${x + padding},${y}`);
  }

  // Calculate current retention
  const daysSinceLastPlay = lastPlayedTime === 0 ? 0 : (now - lastPlayedTime) / (1000 * 60 * 60 * 24);
  const currentT = Math.min(daysSinceLastPlay, daysToShow);
  const currentRetention = currentProgress.stage === 0 ? 0 : 100 * Math.exp(-currentT / S);
  
  // Dot position
  const dotX = padding + (currentT / daysToShow) * (width - 2 * padding);
  const dotY = (height - padding) - (currentRetention / 100) * (height - 2 * padding);

  // Next Review Info
  const nextReviewDate = getNextReviewDate(currentProgress.stage);
  const timeUntilReview = Math.max(0, nextReviewDate.getTime() - now);
  const hoursUntil = Math.floor(timeUntilReview / (1000 * 60 * 60));
  const minsUntil = Math.floor((timeUntilReview % (1000 * 60 * 60)) / (1000 * 60));
  
  const reviewText = currentProgress.stage === 0 
    ? "尚未開始" 
    : timeUntilReview <= 0 
        ? "現在可以溫習了！" 
        : `下次溫習: ${hoursUntil}小時${minsUntil}分後`;

  return (
    <div className="w-full max-w-sm mx-auto bg-white p-4 rounded-3xl shadow-sm border border-[#E0E0E0] mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-[#5D4037] font-bold">
            <TrendingUp className="w-5 h-5" />
            <span>遺忘曲線 & 進度</span>
        </div>
        <div className="flex gap-1">
             {(['A', 'B', 'C'] as const).map(set => (
                 <button 
                    key={set}
                    onClick={() => setSelectedSet(set)}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${selectedSet === set ? 'bg-[#FFB347] text-white' : 'bg-gray-100 text-gray-400'}`}
                 >
                    {set}
                 </button>
             ))}
        </div>
      </div>

      <div className="relative w-full aspect-[2/1] bg-[#FAFAFA] rounded-xl border border-gray-100 overflow-hidden mb-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" strokeWidth="1" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ddd" strokeWidth="1" />
            
            {/* The Curve */}
            <polyline 
                fill="none" 
                stroke={currentProgress.stage === 0 ? "#ddd" : "#4CAF50"} 
                strokeWidth="3" 
                points={points.join(" ")} 
                strokeLinecap="round"
            />

            {/* Current Position Dot */}
            {currentProgress.stage > 0 && (
                <circle cx={dotX} cy={dotY} r="6" fill="#FF5722" stroke="white" strokeWidth="2" className="animate-pulse"/>
            )}
            
            <text x={padding - 5} y={padding + 5} fontSize="10" textAnchor="end" fill="#999">100%</text>
            <text x={width - padding} y={height - 5} fontSize="10" textAnchor="middle" fill="#999">7天</text>
        </svg>

        <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white/90 px-2 py-1 rounded shadow-sm">
             等級: {currentProgress.stage}
        </div>
      </div>

      <div className="flex flex-col gap-2">
         <div className="flex justify-between items-center bg-[#FFF8E1] p-3 rounded-xl border border-[#FFE0B2]">
             <div className="flex items-center gap-2 text-[#F57C00] text-sm font-medium">
                 <Clock className="w-4 h-4" />
                 {reviewText}
             </div>
             {currentRetention < 50 && currentProgress.stage > 0 && (
                 <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                     急需溫習
                 </span>
             )}
         </div>

         <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-400">
               進度越高等級，曲線越平緩。
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 px-2">
                <Trash2 className="w-4 h-4 mr-1"/> 重置進度
            </Button>
         </div>
      </div>
    </div>
  );
};