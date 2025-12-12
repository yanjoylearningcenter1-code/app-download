export const playSound = (type: 'click' | 'defuse' | 'win' | 'error') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'click') {
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'defuse') {
    // "Snip" sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'win') {
    // Victory chord
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    frequencies.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + (i * 0.1));
      o.start(now);
      o.stop(now + 1);
    });
    return; // Early return as we handled oscillators manually
  } else if (type === 'error') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
};

export const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  
  // Cancel previous speech to prevent backlog
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  // Prefer Hong Kong Cantonese, fallback to TW Traditional, then generic Chinese
  utterance.lang = 'zh-HK'; 
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1;
  
  // Try to force a Cantonese voice if available
  const voices = window.speechSynthesis.getVoices();
  const cantoneseVoice = voices.find(v => v.lang === 'zh-HK' || v.lang === 'yue-HK');
  if (cantoneseVoice) {
    utterance.voice = cantoneseVoice;
  }

  window.speechSynthesis.speak(utterance);
};