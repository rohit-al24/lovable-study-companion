import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/api";
import { Mic, X, Sparkles, Volume2 } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

interface FloatingAssistantProps {
  onQuery?: (query: string) => void | string | Promise<string | void>;
  context?: any;
}

const wakeWords = ["griffin"];

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ onQuery, context }) => {
  const { speak } = useVoice();
  const [convoHistory, setConvoHistory] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [saveConversations, setSaveConversations] = useState<boolean>(() => {
    try { return localStorage.getItem('griffin_save_conversations') !== 'false'; } catch { return true; }
  });
  const [liveAssistantOn, setLiveAssistantOn] = useState(false);
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [assistantPos, setAssistantPos] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth - 84 : 100,
    y: typeof window !== 'undefined' ? window.innerHeight - 120 : 100,
  });
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const recognitionRef = useRef<any | null>(null);
  const awaitingSingleStartRef = useRef(false);
  const processingQueryRef = useRef(false);
  const startingBackgroundRef = useRef(false);
  const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
  const singleRef = useRef<any | null>(null);
  const singleRestartCountRef = useRef(0);
  const [listeningForQuery, setListeningForQuery] = useState(false);
  const [popupState, setPopupState] = useState<'hidden'|'listening'|'recognizing'|'reply'>('hidden');
  const [popupTranscript, setPopupTranscript] = useState('');
  const [popupReply, setPopupReply] = useState('');
  const failureCountRef = useRef(0);
  const [expandedView, setExpandedView] = useState(false);

  // Helper: prefer the general (friendly) LLM first, then fall back to page-specific handler or notes
  const handleQuery = async (query: string) => {
    setConvoHistory((h) => [...h, { role: 'user', content: query }].slice(-20));
    let answer = '';
    let source: string | null = null;

    // 1) Try the general LLM first (no notes bias). This makes Griffin a friendly general assistant.
    try {
      const historyText = convoHistory.concat([{ role: 'user', content: query }])
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      // Provide conversation history but avoid forcing notes as context here
      const genContext = historyText.trim();
      const shortQuery = `Please answer briefly with a high-level overview and avoid deep technical details unless the user asks for depth.\n\n${query}`;
      const gen = await fetch(apiUrl('/api/llm/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: shortQuery, context: genContext || '' }),
      });
      if (gen.ok) {
        const gd = await gen.json();
        const genAnswer = gd?.answer || gd?.text || '';
        if (genAnswer && genAnswer.trim()) {
          answer = genAnswer;
          source = 'general';
        }
      }
    } catch (e) {
      console.warn('FloatingAssistant: general LLM primary call failed', e);
    }

    // 2) If the general LLM returned nothing useful, try the page-specific handler (`onQuery`) if provided
    if (!answer || /no answer|couldn't find|i'm not sure|sorry|no response|not sure/i.test(String(answer).toLowerCase())) {
      try {
        if (onQuery) {
          const res = onQuery(query);
          const awaited = await Promise.resolve(res as any);
          if (typeof awaited === 'string' && awaited.trim()) {
            answer = awaited;
            source = 'page';
          }
        }
      } catch (e) {
        console.warn('onQuery handler error', e);
      }
    }

    // 3) As a last resort, try notes-based LLM using the provided page `context` or user's notes from Supabase
    if (!answer || /no answer|couldn't find|i'm not sure|sorry|no response|not sure/i.test(String(answer).toLowerCase())) {
      try {
        // If a page `context` was provided, prefer using it as notes
        let notesText = typeof context === 'string' ? context : '';
        if (!notesText) {
          const { data: userData } = await supabase.auth.getUser();
          const uid = (userData as any)?.user?.id || null;
          if (uid) {
            const { data: notesData } = await supabase
              .from('notes')
              .select('note_text,text')
              .eq('user_id', uid)
              .order('created_at', { ascending: false })
              .limit(50);
            if (notesData && Array.isArray(notesData) && notesData.length > 0) {
              notesText = notesData.map((n: any) => (n.note_text || n.text || '')).filter(Boolean).join('\n');
            }
          }
        }

        if (notesText) {
          const shortQueryNotes = `Please answer briefly with a high-level overview and avoid deep technical details unless the user asks for depth.\n\n${query}`;
          const resp = await fetch(apiUrl('/api/llm/ask'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: shortQueryNotes, context: notesText }),
          });
          if (resp.ok) {
            const data = await resp.json();
            const noteAns = data?.answer || data?.text || '';
            if (noteAns && noteAns.trim()) {
              answer = noteAns;
              source = 'notes';
            }
          }
        }
      } catch (e) {
        console.warn('FloatingAssistant: notes-based attempt failed', e);
      }
    }

    // record assistant reply
    if (answer && String(answer).trim()) {
      setConvoHistory((h) => [...h, { role: 'assistant', content: answer }].slice(-20));
    }

    // Persist to Supabase for user if enabled (non-blocking) — include source in metadata when possible
    if (saveConversations) {
      (async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = (userData as any)?.user?.id || null;
          const metadata = { source };
          await supabase.from('conversations').insert([{ user_id: uid, question: query, answer: answer || '', context: source === 'notes' ? (context || null) : null, metadata }]);
        } catch (e) {
          console.warn('Could not persist conversation to Supabase', e);
        }
      })();
    }

    return answer;
  };

  // Background wake-word listener
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    let mounted = true;

    const startBackground = async () => {
      if (!mounted || !liveAssistantOn) return;
      if (startingBackgroundRef.current) return;
      startingBackgroundRef.current = true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('No getUserMedia available');
        setPopupState('reply');
        setPopupReply('Microphone access API not available in this browser.');
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        try { s.getTracks().forEach((t) => t.stop()); } catch {}
      } catch (err) {
        console.warn('getUserMedia failed', err);
        setPopupState('reply');
        setPopupReply('Microphone permission denied or not available.');
        return;
      }
      const rec = new (window as any).webkitSpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        try {
          if (listeningForQuery) return;
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) final += res[0].transcript;
            else interim += res[0].transcript;
          }
          const text = (final || interim).trim();
          if (!text) return;
          console.log('[FloatingAssistant] Recognized:', text);
          const lowered = text.toLowerCase();
          const griffinIdx = lowered.indexOf('griffin');
          if (griffinIdx !== -1) {
            // Prevent re-entrancy
            if (processingQueryRef.current) return;
            setIsAssistantActive(true);
            setExpandedView(true);
            try { window.speechSynthesis?.cancel(); } catch (e) {}
            // Everything after 'griffin' is the query
            const cleaned = text.slice(griffinIdx + 7).replace(/^\b[\,\s]*/i, '').trim();
            // mark that we want to start single-shot after background stops
            awaitingSingleStartRef.current = true;
            try { rec.stop(); } catch (e) {}
            // If we already captured a query immediately after wake word, handle it
            if (cleaned) {
              processingQueryRef.current = true;
              setTimeout(() => {
                if (cleaned) {
                  handleQuery(cleaned).finally(() => { processingQueryRef.current = false; });
                }
              }, 120);
            }
          }
        } catch (e) {
          console.warn('Assistant background onresult error', e);
        }
      };

      rec.onstart = () => {
        setIsBackgroundRunning(true);
      };
      rec.onerror = (ev: any) => {
        setIsAssistantActive(false);
        setIsBackgroundRunning(false);
        const err = ev?.error || 'unknown';
        if (err === 'aborted') {
          failureCountRef.current = (failureCountRef.current || 0) + 1;
          if (failureCountRef.current <= 3) {
            setTimeout(() => {
              if (mounted && liveAssistantOn && !listeningForQuery) startBackground();
            }, 500 * failureCountRef.current);
            return;
          }
        }
      };
      rec.onend = () => {
        recognitionRef.current = null;
        setIsBackgroundRunning(false);
        startingBackgroundRef.current = false;
        if (!mounted) return;
        // If we requested a single-shot listener, start it now
        if (awaitingSingleStartRef.current && !listeningForQuery) {
          awaitingSingleStartRef.current = false;
          setTimeout(() => startSingleShotListener(''), 500);
          return;
        }
        if (liveAssistantOn && !listeningForQuery) {
          const backoff = (failureCountRef.current || 0) >= 3 ? 2000 : 800;
          setTimeout(() => { if (mounted && liveAssistantOn) startBackground(); }, backoff);
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {
        console.warn('Failed to start background recognizer', e);
      }
    };

    if (liveAssistantOn) startBackground();

    return () => {
      mounted = false;
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [liveAssistantOn, onQuery, listeningForQuery]);

  // Load recent conversations for signed-in user (if any) when component mounts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = (userData as any)?.user?.id || null;
        if (!uid) return;
        const { data } = await supabase.from('conversations').select('question,answer').eq('user_id', uid).order('id', { ascending: false }).limit(50);
        if (!mounted || !data) return;
        const items = (data as any[]).slice().reverse();
        const history: {role: 'user'|'assistant', content: string}[] = [];
        for (const row of items) {
          if (row.question) history.push({ role: 'user', content: row.question });
          if (row.answer) history.push({ role: 'assistant', content: row.answer });
        }
        if (history.length) setConvoHistory(history.slice(-20));
      } catch (e) {
        console.warn('Could not load past conversations', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const startSingleShotListener = (initialText: string = '') => {
    if (!('webkitSpeechRecognition' in window)) return;
    setListeningForQuery(true);
    setIsAssistantActive(true);
    setExpandedView(true);
    setPopupState('listening');
    setPopupTranscript(initialText || '');
    singleRestartCountRef.current = 0;
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    if (singleRef.current) {
      try { singleRef.current.stop(); } catch {}
      singleRef.current = null;
    }
    const srec = new (window as any).webkitSpeechRecognition();
    srec.continuous = false;
    srec.interimResults = true;
    srec.lang = 'en-GB';
    srec.maxAlternatives = 1;
    let captured = initialText || '';
    const startTime = Date.now();
    let lastResultTime = Date.now();
    srec.onresult = (ev: any) => {
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
      console.warn('Single-shot recognizer error', ev.error, ev);
      setPopupReply(`Mic error: ${ev.error || 'unknown'}`);
      setListeningForQuery(false);
      setIsAssistantActive(false);
      setPopupState('reply');
      processingQueryRef.current = false;
      try { recognitionRef.current?.start(); } catch {}
    };
    srec.onend = () => {
      const elapsed = Date.now() - startTime;
      const sinceLast = Date.now() - lastResultTime;
      // If the recognizer ended quickly (likely due to brief silence), allow a few retries
      if (elapsed < 5000 && sinceLast < 2000 && singleRestartCountRef.current < 3) {
        singleRestartCountRef.current++;
        const retryDelay = 400 + singleRestartCountRef.current * 200;
        setTimeout(() => startSingleShotListener(captured), retryDelay);
        return;
      }
      singleRestartCountRef.current = 0;
      setListeningForQuery(false);
      setPopupState('recognizing');
      (async () => {
        try {
          const answer = await handleQuery(captured);
          setPopupReply(answer || 'I heard you, but no response was generated.');
          setPopupState('reply');
          if (answer) speak(answer);
          try { recognitionRef.current?.start(); } catch {}
        } catch (e) {
          setPopupReply('Error getting reply.');
          setPopupState('reply');
          try { recognitionRef.current?.start(); } catch {}
        } finally {
          processingQueryRef.current = false;
        }
      })();
    };
    singleRef.current = srec;
    try { srec.start(); } catch (e) {
      setListeningForQuery(false);
      setIsAssistantActive(false);
      setPopupState('hidden');
      try { recognitionRef.current?.start(); } catch {}
    }
  };

  const closeAssistant = () => {
    setExpandedView(false);
    setPopupState('hidden');
    setIsAssistantActive(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div 
        style={{ 
          position: 'fixed', 
          left: assistantPos.x, 
          top: assistantPos.y, 
          zIndex: 9999, 
          touchAction: 'none' 
        }}
        onPointerDown={(e) => {
          const p = dragRef.current; 
          p.dragging = true; 
          p.startX = e.clientX; 
          p.startY = e.clientY; 
          p.originX = assistantPos.x; 
          p.originY = assistantPos.y; 
          (e.target as Element).setPointerCapture?.((e as any).pointerId);
        }}
        onPointerMove={(e) => {
          const p = dragRef.current; 
          if (!p.dragging) return; 
          const dx = e.clientX - p.startX; 
          const dy = e.clientY - p.startY; 
          setAssistantPos({ 
            x: Math.min(Math.max(8, p.originX + dx), window.innerWidth - 72), 
            y: Math.min(Math.max(8, p.originY + dy), window.innerHeight - 72) 
          });
        }}
        onPointerUp={(e) => { 
          const p = dragRef.current; 
          p.dragging = false; 
          try { (e.target as Element).releasePointerCapture?.((e as any).pointerId); } catch {} 
        }}
      >
        <button
          onClick={() => {
            if (!liveAssistantOn) {
              setLiveAssistantOn(true);
              setExpandedView(true);
            } else {
              if (expandedView) {
                try { window.speechSynthesis?.cancel(); } catch (e) {}
                closeAssistant();
              } else {
                setExpandedView(true);
              }
            }
          }}
          className="relative group"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            padding: 0,
            overflow: 'hidden',
            background: liveAssistantOn 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' 
              : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            boxShadow: liveAssistantOn 
              ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 0 60px rgba(118, 75, 162, 0.3)' 
              : '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 300ms ease',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {/* Animated rings */}
          {liveAssistantOn && (
            <>
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(102,126,234,0.3), rgba(240,147,251,0.3))',
                  animation: 'pulse-ring 2s ease-out infinite',
                }}
              />
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(240,147,251,0.2))',
                  animation: 'pulse-ring 2s ease-out infinite 0.5s',
                }}
              />
            </>
          )}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <img 
              src="/loader3.gif" 
              alt="Griffin AI" 
              style={{ 
                width: '85%', 
                height: '85%', 
                objectFit: 'cover', 
                borderRadius: '50%',
                filter: liveAssistantOn ? 'brightness(1.1) saturate(1.2)' : 'grayscale(0.3)',
              }} 
            />
          </div>
        </button>
      </div>

      {/* Expanded View - Google/Siri Style */}
      {expandedView && (
        <div 
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            animation: 'fade-in 200ms ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAssistant();
          }}
        >
          <div 
            className="w-full sm:w-[420px] sm:max-w-[90vw] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{
              boxShadow: '0 -20px 60px rgba(102, 126, 234, 0.3), 0 0 100px rgba(118, 75, 162, 0.2)',
              animation: 'slide-up 300ms ease-out',
            }}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button 
                onClick={closeAssistant}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
              
              {/* Orb Animation */}
              <div className="flex justify-center mb-6">
                <div 
                  className="relative"
                  style={{
                    width: 120,
                    height: 120,
                  }}
                >
                  {/* Outer glow rings */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(102,126,234,0.4), rgba(240,147,251,0.4))',
                      filter: 'blur(20px)',
                      animation: listeningForQuery ? 'orb-pulse 1.5s ease-in-out infinite' : 'orb-idle 3s ease-in-out infinite',
                    }}
                  />
                  <div 
                    className="absolute inset-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(102,126,234,0.6), rgba(240,147,251,0.6))',
                      filter: 'blur(10px)',
                      animation: listeningForQuery ? 'orb-pulse 1.5s ease-in-out infinite 0.2s' : 'orb-idle 3s ease-in-out infinite 0.5s',
                    }}
                  />
                  {/* Core orb */}
                  <div 
                    className="absolute inset-4 rounded-full overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
                      boxShadow: '0 0 40px rgba(102, 126, 234, 0.5)',
                    }}
                  >
                    <img 
                      src="/loader3.gif" 
                      alt="Griffin" 
                      className="w-full h-full object-cover"
                      style={{
                        filter: 'brightness(1.1)',
                      }}
                    />
                  </div>
                  {/* Listening indicator waves */}
                  {listeningForQuery && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-white/30" style={{ animation: 'wave-expand 1.5s ease-out infinite' }} />
                      <div className="absolute inset-0 rounded-full border-2 border-white/20" style={{ animation: 'wave-expand 1.5s ease-out infinite 0.5s' }} />
                      <div className="absolute inset-0 rounded-full border-2 border-white/10" style={{ animation: 'wave-expand 1.5s ease-out infinite 1s' }} />
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-1">Griffin — Friendly Assistant</h2>
                <p className="text-white/60 text-sm flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Your friendly AI assistant
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <label className="text-xs text-white/70">Save chats</label>
                  <input
                    type="checkbox"
                    checked={saveConversations}
                    onChange={(e) => { setSaveConversations(e.target.checked); try { localStorage.setItem('griffin_save_conversations', String(e.target.checked)); } catch {} }}
                  />
                </div>
              </div>
            </div>

            {/* Status Area */}
            <div className="px-6 pb-4">
              <div 
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 min-h-[100px] flex flex-col items-center justify-center"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {popupState === 'hidden' && !listeningForQuery && (
                  <div className="text-center">
                    <p className="text-white/80 text-lg mb-2">
                      {liveAssistantOn ? 'Say "Griffin" to ask a question' : 'Tap the mic to start'}
                    </p>
                    <p className="text-white/40 text-sm">or press the button below</p>
                  </div>
                )}
                
                {(popupState === 'listening' || listeningForQuery) && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i}
                          className="w-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full"
                          style={{
                            height: 20 + Math.random() * 20,
                            animation: `equalizer 0.5s ease-in-out infinite ${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-white/80 text-lg">Listening...</p>
                    {popupTranscript && (
                      <p className="text-white mt-2 text-sm bg-white/10 rounded-lg px-3 py-2">
                        "{popupTranscript}"
                      </p>
                    )}
                  </div>
                )}
                
                {popupState === 'recognizing' && (
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3 mx-auto" />
                    <p className="text-white/80">Processing...</p>
                  </div>
                )}
                
                {popupState === 'reply' && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Volume2 className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm">Griffin says:</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{popupReply}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  if (!listeningForQuery) startSingleShotListener('');
                }}
                disabled={listeningForQuery}
                className="flex-1 py-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  background: listeningForQuery 
                    ? 'linear-gradient(135deg, #ef4444, #f97316)' 
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                }}
              >
                <Mic className="w-5 h-5" />
                {listeningForQuery ? 'Listening...' : 'Push to Talk'}
              </button>
              
              <button
                onClick={() => setLiveAssistantOn(!liveAssistantOn)}
                className="px-6 py-4 rounded-2xl font-medium transition-all"
                style={{
                  background: liveAssistantOn ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: liveAssistantOn ? '#ef4444' : '#22c55e',
                  border: `1px solid ${liveAssistantOn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                }}
              >
                {liveAssistantOn ? 'Stop' : 'Start'}
              </button>
            </div>

            {/* Quick Tips */}
            <div className="px-6 pb-6">
              <p className="text-white/40 text-xs text-center">
                💡 Try: "Griffin, explain photosynthesis" or "Quiz me on calculus"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes orb-idle {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes wave-expand {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes equalizer {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        @keyframes slide-up {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default FloatingAssistant;
