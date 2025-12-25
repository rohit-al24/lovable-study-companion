import { useState, useRef, useEffect } from "react";

interface FloatingAssistantProps {
  onQuery?: (query: string) => void;
  context?: any;
}

const wakeWords = ["axios", "alexa", "lovable"];

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ onQuery, context }) => {
  const [liveAssistantOn, setLiveAssistantOn] = useState(false);
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [assistantPos, setAssistantPos] = useState<{ x: number; y: number }>({
    x: window.innerWidth - 84,
    y: window.innerHeight - 120,
  });
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const recognitionRef = useRef<any | null>(null);

  // Background wake-word listener
  useEffect(() => {
    if (!liveAssistantOn) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      return;
    }
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }
    const rec = new (window as any).webkitSpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-GB';
    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      const text = (final || interim).trim();
      if (!text) return;
      const lowered = text.toLowerCase();
      for (const word of wakeWords) {
        if (lowered.startsWith(word)) {
          setIsAssistantActive(true);
          setTimeout(() => setIsAssistantActive(false), 800);
          // Remove wake word and send query
          const cleaned = text.replace(new RegExp(`^(${wakeWords.join('|')})\\b[,.\s]*`, 'i'), '').trim();
          if (cleaned && onQuery) onQuery(cleaned);
          break;
        }
      }
    };
    rec.onerror = () => setIsAssistantActive(false);
    rec.onend = () => {};
    recognitionRef.current = rec;
    rec.start();
    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [liveAssistantOn, onQuery]);

  return (
    <div style={{ position: 'fixed', left: assistantPos.x, top: assistantPos.y, zIndex: 60, touchAction: 'none' }}
      onPointerDown={(e) => {
        const p = dragRef.current; p.dragging = true; p.startX = e.clientX; p.startY = e.clientY; p.originX = assistantPos.x; p.originY = assistantPos.y; (e.target as Element).setPointerCapture?.((e as any).pointerId);
      }}
      onPointerMove={(e) => {
        const p = dragRef.current; if (!p.dragging) return; const dx = e.clientX - p.startX; const dy = e.clientY - p.startY; setAssistantPos({ x: Math.min(Math.max(8, p.originX + dx), window.innerWidth - 72), y: Math.min(Math.max(8, p.originY + dy), window.innerHeight - 72) });
      }}
      onPointerUp={(e) => { const p = dragRef.current; p.dragging = false; try { (e.target as Element).releasePointerCapture?.((e as any).pointerId); } catch {} }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setLiveAssistantOn((s) => !s)}
          title={liveAssistantOn ? 'Disable Live Assistant' : 'Enable Live Assistant'}
          className="rounded-full p-2 shadow-lg"
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            padding: 0,
            overflow: 'hidden',
            background: liveAssistantOn ? '#0ea5a0' : '#fff',
            transition: 'transform 220ms ease, box-shadow 220ms ease'
          }}
        >
          <img src="/loader3.gif" alt="live" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: liveAssistantOn ? 'saturate(1.2) brightness(1.05)' : 'none' }} />
        </button>
        {/* Expansion / Siri-style visual */}
        {isAssistantActive && (
          <div style={{ position: 'absolute', left: -64, top: -64, width: 192, height: 192, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(14,165,160,0.12)', backdropFilter: 'blur(6px)', transform: 'scale(1)', animation: 'siriExpand 700ms ease-out' }} />
          </div>
        )}
        {liveAssistantOn && (
          <div style={{ position: 'absolute', right: 80, bottom: 8, width: 240 }}>
            <div className={`p-3 rounded-xl shadow-xl bg-card border border-neutral/10 ${isAssistantActive ? 'scale-105' : ''}`}>
              <div className="flex items-center gap-3">
                <img src="/loader3.gif" alt="active" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div>
                  <div className="font-semibold">Axios (Live)</div>
                  <div className="text-sm text-muted-foreground">Say "Axios" or "Alexa" to ask a question</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
