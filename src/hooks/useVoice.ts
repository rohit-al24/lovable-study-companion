import { useCallback } from "react";

export const useVoice = () => {
  const speak = useCallback((text: string, rate: number = 1) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      
      // Try to get a non-default voice (e.g., UK English Female, or first available)
      const voices = window.speechSynthesis.getVoices();
      let preferredVoice = voices.find(
        (v) => v.name.includes("UK") && v.name.includes("Female")
      );
      if (!preferredVoice) {
        preferredVoice = voices.find(
          (v) => v.name !== "default" && v.lang.startsWith("en")
        );
      }
      if (!preferredVoice && voices.length > 0) {
        preferredVoice = voices[0];
      }
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

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
