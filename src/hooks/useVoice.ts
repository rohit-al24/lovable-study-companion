import { useCallback } from "react";

export const useVoice = (selectedVoiceName?: string) => {
  const speak = useCallback((text: string, rate: number = 1) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      
      // If a specific voice is selected, use it
      const voices = window.speechSynthesis.getVoices();
      let preferredVoice = undefined;
      if (selectedVoiceName) {
        preferredVoice = voices.find(v => v.name === selectedVoiceName);
      }
      if (!preferredVoice) {
        // Prioritize a female UK English voice (check name for female hint since gender property doesn't exist)
        preferredVoice =
          voices.find(v => v.lang === "en-GB" && v.name.toLowerCase().includes("female")) ||
          voices.find(v => v.lang === "en-GB" && v.name.toLowerCase().includes("uk")) ||
          voices.find(v => v.lang === "en-GB") ||
          voices.find(v => v.lang && v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
          voices.find(v => v.lang && v.lang.startsWith("en"));
      }
      // Fallback to first available
      if (!preferredVoice && voices.length > 0) {
        preferredVoice = voices[0];
      }
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedVoiceName]);

  const playClickSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  const playSuccessSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playNote(523.25, now, 0.15); // C5
    playNote(659.25, now + 0.15, 0.15); // E5
    playNote(783.99, now + 0.3, 0.2); // G5
  }, []);

  return { speak, playClickSound, playSuccessSound };
};
