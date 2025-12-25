import { useState, useRef, useEffect } from "react";

interface FloatingAssistantProps {
  // allow onQuery to return void, a string, or a Promise<string>
  onQuery?: (query: string) => void | string | Promise<string>;
  context?: any;
}

const wakeWords = ["griffin"];

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
  const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
  const singleRef = useRef<any | null>(null);
  const [listeningForQuery, setListeningForQuery] = useState(false);
  const [popupState, setPopupState] = useState<'hidden'|'listening'|'recognizing'|'reply'>('hidden');
  const [popupTranscript, setPopupTranscript] = useState('');
  const [popupReply, setPopupReply] = useState('');
  const failureCountRef = useRef(0);

  // Background wake-word listener
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    let mounted = true;

    const startBackground = async () => {
      if (!mounted || !liveAssistantOn) return;
      // ensure microphone access first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('No getUserMedia available');
        setPopupState('reply');
        setPopupReply('Microphone access API not available in this browser.');
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        // immediately stop tracks; this is just a permission/test probe
        try { s.getTracks().forEach((t) => t.stop()); } catch {}
      } catch (err) {
        console.warn('getUserMedia failed', err);
        setPopupState('reply');
        setPopupReply('Microphone permission denied or not available. Please allow microphone access.');
        return;
      }
      // create a new recognizer each time to avoid stale state
      const rec = new (window as any).webkitSpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      rec.onresult = (event: any) => {
        try {
          if (listeningForQuery) return; // ignore while single-shot active
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) final += res[0].transcript;
            else interim += res[0].transcript;
          }
          const text = (final || interim).trim();
          if (!text) return;
          const t = text.trim();
          const lowered = t.toLowerCase();
          if (lowered.startsWith('griffin')) {
            setIsAssistantActive(true);
            const cleaned = t.replace(/^(griffin)\b[\,\s]*/i, '').trim();
            // start focused capture if user didn't provide more after wake word
            if (!cleaned) {
              // stop this background recorder before starting single-shot
              try { rec.stop(); } catch (e) {}
              startSingleShotListener('');
            } else {
              // small delay then send cleaned text
              setTimeout(() => { if (cleaned && onQuery) onQuery(cleaned); }, 120);
            }
          }
        } catch (e) {
          console.warn('Assistant background onresult error', e);
        }
      };

      rec.onstart = () => {
        console.debug('FloatingAssistant background recognizer started');
        setIsBackgroundRunning(true);
      };
      rec.onerror = (ev: any) => {
        console.warn('FloatingAssistant recognizer error', ev);
        setIsAssistantActive(false);
        setIsBackgroundRunning(false);
        const err = ev?.error || (ev?.message ? 'error' : 'unknown');
        // handle 'aborted' by retrying a few times with backoff
        if (err === 'aborted') {
          failureCountRef.current = (failureCountRef.current || 0) + 1;
          if (failureCountRef.current <= 3) {
            setPopupState('reply');
            setPopupReply('Recognition aborted — retrying...');
            setTimeout(() => {
              if (mounted && liveAssistantOn && !listeningForQuery) startBackground();
            }, 500 * failureCountRef.current);
            return;
          }
          // too many failures
          setPopupState('reply');
          setPopupReply('Speech recognition repeatedly aborted. Try reloading the page or checking your microphone.');
          return;
        }
        // generic error: show guidance
        setPopupState('reply');
        setPopupReply('Speech recognition error. Check microphone permissions.');
      };
      rec.onend = () => {
        recognitionRef.current = null;
        setIsBackgroundRunning(false);
        console.debug('FloatingAssistant background ended, failureCount=', failureCountRef.current);
        if (!mounted) return;
        // restart unless we're in single-shot or live turned off
        if (liveAssistantOn && !listeningForQuery) {
          // backoff increases if we've seen multiple aborts
          const backoff = (failureCountRef.current || 0) >= 3 ? 2000 : 300;
          setTimeout(() => { if (mounted && liveAssistantOn) startBackground(); }, backoff);
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {
        console.warn('Failed to start background recognizer', e);
        setPopupState('reply');
        setPopupReply('Failed to start speech recognition (see console).');
      }
    };

    if (liveAssistantOn) startBackground();

    return () => {
      mounted = false;
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [liveAssistantOn, onQuery, listeningForQuery]);

  // Allow user to reset recognizers and clear abort counters
  const resetRecognizers = () => {
    failureCountRef.current = 0;
    try { recognitionRef.current?.stop(); } catch {}
    try { singleRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    singleRef.current = null;
    setPopupState('reply');
    setPopupReply('Resetting recognizers...');
    // toggle liveAssistantOn to force the useEffect to restart recognizers
    setLiveAssistantOn(false);
    setTimeout(() => setLiveAssistantOn(true), 600);
    setTimeout(() => setPopupState('hidden'), 1400);
  };

    // single-shot listener for capturing user's full question after wake-word
    const startSingleShotListener = (initialText: string = '') => {
      if (!('webkitSpeechRecognition' in window)) return;
      setListeningForQuery(true);
      setIsAssistantActive(true);
      setListeningForQuery(true);
      setIsAssistantActive(true);
      setPopupState('listening');
      setPopupTranscript(initialText || '');
      // stop any existing single
      if (singleRef.current) {
        try { singleRef.current.stop(); } catch {}
        singleRef.current = null;
      }
      const srec = new (window as any).webkitSpeechRecognition();
      srec.continuous = false;
      srec.interimResults = true; // show live interim
      srec.lang = 'en-GB';
      srec.maxAlternatives = 1;
      let captured = initialText || '';
      const startTime = Date.now();
      let lastResultTime = Date.now();
      srec.onresult = (ev: any) => {
        // accumulate interim/final
        let interim = '';
        let final = '';
        for (let i = ev.resultIndex; i < ev.results.length; ++i) {
          const r = ev.results[i];
          if (r.isFinal) final += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (final) captured = (captured + ' ' + final).trim();
        const display = (captured + ' ' + interim).trim();
        lastResultTime = Date.now();
        setPopupTranscript(display);
      };
      srec.onerror = (ev: any) => {
        console.warn('Single-shot recognizer error', ev);
        const err = ev?.error || (ev?.message ? 'error' : 'unknown');
        setListeningForQuery(false);
        setIsAssistantActive(false);
        setPopupState('hidden');
        if (err === 'aborted') {
          failureCountRef.current = (failureCountRef.current || 0) + 1;
          // small retry once
          setTimeout(() => startSingleShotListener(captured), 300);
          return;
        }
        // resume background
        try { recognitionRef.current?.start(); } catch {}
      };
      srec.onend = () => {
        const elapsed = Date.now() - startTime;
        const silence = Date.now() - lastResultTime;
        // enforce minimum 3s listening; if too short, restart single-shot to continue
        if (elapsed < 3000) {
          // restart to keep listening
          setTimeout(() => startSingleShotListener(captured), 120);
          return;
        }
        // if we recently got a result but recognizer ended, proceed
        setListeningForQuery(false);
        setIsAssistantActive(false);
        // move to recognizing/loading
        setPopupState('recognizing');
        // call onQuery and show reply in popup
        (async () => {
          try {
            let answer = '';
            if (onQuery) {
              // normalize whatever onQuery returns (void | string | Promise<string>)
              const result = onQuery(captured);
              // await Promise.resolve(...) so both sync and async returns are handled uniformly
              const awaited = await Promise.resolve(result as any);
              if (typeof awaited === 'string') {
                answer = awaited;
              } else if (typeof result === 'string') {
                // fallback if awaited isn't a string but original result was sync string
                answer = result;
              } else {
                answer = '';
              }
            }
            setPopupReply(answer || 'No reply');
            setPopupState('reply');
            // resume background recognition
            try { recognitionRef.current?.start(); } catch {}
          } catch (e) {
            setPopupReply('Error getting reply.');
            setPopupState('reply');
            try { recognitionRef.current?.start(); } catch {}
          }
        })();
      };
      singleRef.current = srec;
      try { srec.start(); } catch (e) {
        // if start fails, immediately cleanup
        setListeningForQuery(false);
        setIsAssistantActive(false);
        setPopupState('hidden');
        try { recognitionRef.current?.start(); } catch {}
      }
    };

  // Inline AssistantPopup component
  const AssistantPopup: React.FC<{ state: 'hidden'|'listening'|'recognizing'|'reply'; transcript: string; reply: string; onClose: () => void }> = ({ state, transcript, reply, onClose }) => {
    if (state === 'hidden') return null;
    return (
      <div style={{
        position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 1000,
        background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', padding: 28, minWidth: 320, maxWidth: '90vw', minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {state === 'listening' && <>
            <div style={{ fontWeight: 600, color: '#0ea5a0', marginBottom: 8 }}>Listening…</div>
            <div style={{ fontSize: 18, minHeight: 32 }}>{transcript || <span style={{ color: '#aaa' }}>Say something…</span>}</div>
          </>}
          {state === 'recognizing' && <>
            <div style={{ fontWeight: 600, color: '#0ea5a0', marginBottom: 8 }}>Recognizing…</div>
            <div style={{ fontSize: 18, minHeight: 32 }}>{transcript}</div>
          </>}
          {state === 'reply' && <>
            <div style={{ fontWeight: 600, color: '#0ea5a0', marginBottom: 8 }}>Assistant</div>
            <div style={{ fontSize: 18, minHeight: 32 }}>{reply}</div>
          </>}
          <button onClick={onClose} style={{ marginTop: 12, background: '#0ea5a0', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  };

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
        {/* Push-to-talk button */}
        {liveAssistantOn && (
          <button
            onClick={() => {
              // start manual single-shot listen
              if (!listeningForQuery) startSingleShotListener('');
            }}
            title={listeningForQuery ? 'Listening...' : 'Push to talk'}
            className="rounded-full p-1 shadow-md"
            style={{
              position: 'absolute',
              right: -8,
              top: -20,
              width: 40,
              height: 40,
              borderRadius: 20,
              background: listeningForQuery ? '#f97316' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1C10.3431 1 9 2.34315 9 4V11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11V4C15 2.34315 13.6569 1 12 1Z" fill={listeningForQuery ? '#fff' : '#111827'} />
              <path d="M19 11C19 14.3137 16.3137 17 13 17H11C7.68629 17 5 14.3137 5 11" stroke={listeningForQuery ? '#fff' : '#111827'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
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
                  <div className="font-semibold">Griffin (Live)</div>
                    <div className="text-sm text-muted-foreground">{listeningForQuery ? 'Listening… speak now' : 'Say "Griffin" to ask a question'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Diagnostics / Reset controls */}
        {liveAssistantOn && (
          <div style={{ position: 'absolute', right: 80, bottom: -48, width: 260, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>abortRetries: {failureCountRef.current}</div>
            <button onClick={resetRecognizers} style={{ background: '#efefef', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Reset</button>
            <button onClick={() => { setPopupState('reply'); setPopupReply('If problems persist: allow mic permissions, reload, or use Push-to-talk.'); }} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Help</button>
          </div>
        )}
          {/* Assistant popup UI */}
          <AssistantPopup state={popupState} transcript={popupTranscript} reply={popupReply} onClose={() => { setPopupState('hidden'); setPopupTranscript(''); setPopupReply(''); }} />
      </div>
    </div>
  );
};

export default FloatingAssistant;
