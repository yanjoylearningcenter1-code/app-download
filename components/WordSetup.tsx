import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Camera, Image as ImageIcon, Sparkles, X, Type, Mic, MicOff } from 'lucide-react';
import { generateWordSetsFromInput } from '../services/geminiService';
import { WordSets } from '../types';

interface WordSetupProps {
  onConfirm: (sets: WordSets) => void;
  onCancel: () => void;
}

export const WordSetup: React.FC<WordSetupProps> = ({ onConfirm, onCancel }) => {
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setError(null);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("您的瀏覽器不支援語音輸入功能 (建議使用 Chrome 或 Safari)");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-HK'; // Hong Kong Cantonese
      recognition.continuous = true;
      recognition.interimResults = true;

      // Store the text present BEFORE speaking starts
      const initialText = textInput;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => setIsListening(false);

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
           setError("請允許使用麥克風權限以使用語音輸入。");
        }
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        // Append the new spoken text to the initial text
        // Add a newline if there was previous text and it didn't end with one
        const prefix = initialText + (initialText && !initialText.endsWith('\n') ? '\n' : '');
        setTextInput(prefix + transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setError("啟動語音輸入失敗");
    }
  };

  const handleSubmit = async () => {
    if (!textInput.trim() && !selectedImage) {
      setError("請輸入文字或上載圖片。");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Stop listening if submitting
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    try {
      const sets = await generateWordSetsFromInput(textInput, selectedImage);
      onConfirm(sets);
    } catch (err: any) {
      setError(err.message || "處理失敗，請重試。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-6 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#5D4037]">自訂字詞設定</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}><X /></Button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#E0E0E0] space-y-6">
        
        {/* Text Input Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-[#5D4037] font-semibold">
              <Type className="w-5 h-5" />
              輸入 / 語音 / 貼上文字
            </label>
            
            <button
              onClick={toggleVoiceInput}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" /> 停止聆聽...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> 語音輸入
                </>
              )}
            </button>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={isListening ? "正在聆聽..." : "請在此輸入課文、單字列表或句子..."}
            className={`w-full h-32 p-4 rounded-xl border-2 outline-none resize-none transition-all text-gray-700
              ${isListening ? 'border-red-400 ring-4 ring-red-100' : 'border-[#E0E0E0] focus:border-[#FFB347] focus:ring-4 focus:ring-[#FFB347]/20'}
            `}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-bold">或者</span>
          </div>
        </div>

        {/* Image Input Section */}
        <div className="space-y-2">
           <label className="flex items-center gap-2 text-[#5D4037] font-semibold">
            <Camera className="w-5 h-5" />
            影相 / 上載圖片
          </label>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            capture="environment" // Hints mobile browsers to use camera
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
              ${selectedImage ? 'border-[#AED581] bg-[#F1F8E9]' : 'border-[#E0E0E0] bg-gray-50 hover:bg-[#FFF3E0] hover:border-[#FFB347]'}
            `}
          >
            {selectedImage ? (
              <div className="text-center">
                 <ImageIcon className="w-8 h-8 text-[#558B2F] mx-auto mb-2" />
                 <p className="text-[#33691E] font-medium truncate max-w-[200px]">{selectedImage.name}</p>
                 <p className="text-xs text-[#558B2F]">點擊更換圖片</p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <p>影相或選取圖片 (OCR)</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <Button 
          onClick={handleSubmit} 
          className="w-full" 
          size="lg"
          isLoading={isProcessing}
        >
          {isProcessing ? 'AI 分析中...' : (
            <>
              <Sparkles className="w-5 h-5" />
              生成遊戲關卡
            </>
          )}
        </Button>
      </div>
      
      <p className="text-center text-gray-400 text-sm mt-6">
        由 Gemini AI 提供支援。系統會自動將您的內容識別為繁體中文並分類為 簡單 (A)、中等 (B) 和 困難 (C) 等級。
      </p>
    </div>
  );
};