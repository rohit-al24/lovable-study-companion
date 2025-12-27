import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { useVoice } from "@/hooks/useVoice";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Send, Heart, Upload, Sparkles, Mic } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  source?: string | null;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { speak } = useVoice(localStorage.getItem('griffin_voice') || '');
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const userScrolledRef = useRef(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('A');

  const aiProfile = { name: 'Griffin', initials: 'G', avatar: '/public/loader3.gif' }; // Updated AI profile to include avatar path

  const initialsFromName = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }

  // Load recent conversations from Supabase (if signed in)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = (userData as any)?.user?.id || null;
        if (!uid) {
          // seed with greeting
          if (mounted) setMessages([{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your friendly AI assistant. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
          return;
        }
        const { data } = await supabase.from('conversations').select('question,answer,context,metadata,created_at').eq('user_id', uid).order('id', { ascending: false }).limit(50);
        if (!mounted) return;
        if (!data || data.length === 0) {
          setMessages([{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your friendly AI assistant. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
          return;
        }
        const rows = (data as any[]).slice().reverse();
        const msgs: Message[] = [];
        for (const r of rows) {
          if (r.question) msgs.push({ role: 'user', content: r.question, timestamp: new Date(r.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
          if (r.answer) msgs.push({ role: 'assistant', content: r.answer, timestamp: new Date(r.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), source: r.context ? 'notes' : (r.metadata?.source || null) });
        }
        setMessages(msgs.length ? msgs : [{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your friendly AI assistant. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        // ensure profile info from auth/profile
        try {
          const { data: userProfileData } = await supabase.from('profiles').select('name,avatar_url').eq('id', uid).single();
          const name = (userProfileData as any)?.name || null;
          if (name) {
            setUserName(name);
            setUserInitials(initialsFromName(name));
          } else {
            const metaName = (userData as any)?.user?.user_metadata?.full_name || null;
            setUserName(metaName || null);
            setUserInitials(initialsFromName(metaName || 'You'));
          }
        } catch (e) {
          const metaName = (userData as any)?.user?.user_metadata?.full_name || null;
          setUserName(metaName || null);
          setUserInitials(initialsFromName(metaName || 'You'));
        }

        // scroll to bottom after loading history and ensure auto-scroll enabled
        setTimeout(() => { messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'auto' }); userScrolledRef.current = false; setShowScrollButton(false); }, 80);
      } catch (e) {
        console.warn('Failed loading conversations', e);
        if (mounted) setMessages([{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your friendly AI assistant. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    // small delay to allow DOM update
    setTimeout(() => {
      try {
        if (!userScrolledRef.current) {
          // prefer scrollIntoView on the end ref if available
          if (messagesEndRef.current) {
            try { messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }
            catch { messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' }); }
          } else {
            messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
          }
        }
      } catch {}
    }, 80);
  }, [messages.length]);

  // ensure we attempt a scroll on mount in case messages already exist
  useEffect(() => {
    setTimeout(() => { if (!userScrolledRef.current) scrollToBottom(); }, 200);
  }, []);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollButton(!atBottom);
    userScrolledRef.current = !atBottom;
  };

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    userScrolledRef.current = false;
    setShowScrollButton(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const now = new Date();
    const userMsg: Message = { role: 'user', content: input, timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    const question = input;
    setInput('');
    setLoading(true);
    // show temporary assistant typing
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Thinking...', timestamp: '' }]);
    try {
      // Quick local answer: if user asks for their own name, return from profile (avoid LLM hallucination)
      const qLower = question.trim().toLowerCase();
      if (/^(what(?:'s| is)? my name|who am i|do you know my name)\b/.test(qLower) || qLower.includes("my name")) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = (userData as any)?.user?.id || null;
          if (uid) {
            const { data: profile } = await supabase.from('profiles').select('name').eq('id', uid).single();
            const name = (profile as any)?.name || (userData as any)?.user?.user_metadata?.full_name || null;
            if (name) {
              const assistantMsg: Message = { role: 'assistant', content: `Your name is ${name}.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), source: 'general' };
              setMessages((prev) => {
                const copy = prev.slice();
                if (copy.length && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === 'Thinking...') copy.pop();
                return [...copy, assistantMsg];
              });
              try { speak(`Your name is ${name}.`); } catch {}
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Could not fetch profile for name lookup', e);
        }
        // If no name found, short-circuit with a neutral reply
        const assistantMsgNoName: Message = { role: 'assistant', content: "I don't have your name on file.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), source: 'general' };
        setMessages((prev) => {
          const copy = prev.slice();
          if (copy.length && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === 'Thinking...') copy.pop();
          return [...copy, assistantMsgNoName];
        });
        try { speak("I don't have your name on file."); } catch {}
        setLoading(false);
        return;
      }
      // Prefer general LLM (Ollama) first for open questions; fall back to user's notes if needed
      let answer = '';
      let source: string | null = null;
      let notesContext = '';

      try {
        // 1) General LLM call (no context)
        try {
          const shortQ = `Please answer briefly with a high-level overview and avoid deep technical details unless requested.\n\n${question}`;
          const respGen = await fetch(apiUrl('/api/llm/ask'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: shortQ, context: '' }),
          });
          if (respGen.ok) {
            const genData = await respGen.json();
            const gen = genData?.answer || genData?.text || '';
            if (gen && gen.trim()) {
              answer = gen;
              source = 'general';
            }
          }
        } catch (e) {
          console.warn('General LLM primary call failed', e);
        }

        // 2) If general LLM returned nothing useful, try notes
        if (!answer || /no answer|couldn't find|i'm not sure|sorry|no response|don't know/i.test(String(answer).toLowerCase())) {
          try {
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
                notesContext = notesData.map((n: any) => (n.note_text || n.text || '')).filter(Boolean).join('\n');
              }
            }

            if (notesContext) {
              const shortQNotes = `Please answer briefly with a high-level overview and avoid deep technical details unless requested.\n\n${question}`;
              const resp = await fetch(apiUrl('/api/llm/ask'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: shortQNotes, context: notesContext }),
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
            console.warn('Notes-based attempt failed', e);
          }
        }
      } catch (e) {
        console.warn('Answering flow failed', e);
      }
      const assistantMsg: Message = { role: 'assistant', content: answer, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), source };
      setMessages((prev) => {
        const copy = prev.slice();
        // remove last temporary assistant placeholder
        if (copy.length && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === 'Thinking...') copy.pop();
        return [...copy, assistantMsg];
      });
      // speak answer
      try { speak(answer); } catch {}

      // Persist to Supabase if user opted in (include whether notes were used)
      try {
        const shouldSave = localStorage.getItem('griffin_save_conversations') !== 'false';
        if (shouldSave) {
          const { data: userData } = await supabase.auth.getUser();
          const uid = (userData as any)?.user?.id || null;
          const contextToSave = source === 'notes' ? (typeof notesContext === 'string' ? notesContext.slice(0, 10000) : null) : null;
          const metadata = { source };
          await supabase.from('conversations').insert([{ user_id: uid, question, answer, context: contextToSave, metadata }]);
        }
      } catch (e) {
        console.warn('Could not persist chat', e);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => {
        const copy = prev.slice();
        if (copy.length && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === 'Thinking...') copy.pop();
        return [...copy, { role: 'assistant', content: 'Error while contacting assistant.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Summarize my notes", icon: Sparkles },
    { label: "Explain this topic", icon: Heart },
    { label: "Generate quiz", icon: Sparkles },
    { label: "Study tips", icon: Heart },
  ];

  return (
    <div className="min-h-screen overflow-hidden relative">
      <Navigation />

      {/* Animated background (from Index/Splash design) */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        }}
      >
        <div 
          className="absolute w-96 h-96 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.8) 0%, transparent 70%)',
            top: '-10%',
            right: '-10%',
            filter: 'blur(60px)',
            animation: 'float-slow 8s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(240, 147, 251, 0.8) 0%, transparent 70%)',
            bottom: '10%',
            left: '-5%',
            filter: 'blur(50px)',
            animation: 'float-slow 10s ease-in-out infinite reverse',
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(118, 75, 162, 0.8) 0%, transparent 70%)',
            top: '40%',
            left: '50%',
            filter: 'blur(40px)',
            animation: 'float-slow 6s ease-in-out infinite',
          }}
        />

        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col pt-24">
        <div className="animate-fade-in flex flex-col h-full">
          {/* Header */}
          <div className="mb-6">
              <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-hero rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Chat with <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', WebkitBackgroundClip: 'text' }}>Griffin</span>
                </h1>
                <p className="text-sm text-white/60">Your friendly AI assistant</p>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-4 px-4 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 justify-start gap-3"
                    onClick={() => setInput(action.label)}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Messages (centered, narrower container) */}
          <div className="flex-1 overflow-y-auto mb-6" ref={messagesContainerRef} style={{ paddingBottom: 180 }} onScroll={handleScroll}>
              <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-slide-up ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className={`w-10 h-10 ${message.role === "assistant" ? "bg-gradient-hero" : "bg-muted"}`}>
                    {message.role === "assistant" ? (
                      <img src={aiProfile.avatar} alt="AI Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium">{userInitials}</span>
                    )}
                  </Avatar>

                  <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[78%]`}> 
                    <Card
                      className={`p-4 shadow-card rounded-xl ${
                        message.role === "assistant"
                          ? "bg-white/10 backdrop-blur-md border border-white/10 text-white/90"
                          : "bg-white/8 backdrop-blur-sm border border-white/6 text-white/90"
                      }`}
                    >
                      <p className="text-sm text-white/90">{message.content}</p>
                      {message.role === 'assistant' && message.source && (
                        <div className="mt-2">
                          <span className={`inline-block text-[10px] px-2 py-1 rounded-full ${message.source === 'notes' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                            {message.source === 'notes' ? 'Notes' : 'General'}
                          </span>
                        </div>
                      )}
                    </Card>
                    <span className="text-xs text-white/50 mt-1">{message.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {showScrollButton && (
            <div className="fixed right-6 bottom-36 z-50">
              <button onClick={scrollToBottom} className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center">↓</button>
            </div>
          )}

          {/* Input */}
          {/* Floating, centered pinned input at bottom */}
          <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 w-full max-w-3xl px-4" style={{ pointerEvents: 'auto' }}>
            <Card className="p-0 shadow-soft bg-white/6 backdrop-blur-md border border-white/10 rounded-full">
              <div className="flex items-center gap-3 px-4 py-3">
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                  <Upload className="w-5 h-5 text-white/80" />
                </Button>

                <Input
                  placeholder="Ask Griffin anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 border-none bg-transparent focus-visible:ring-0 text-white/90 placeholder:text-white/60"
                />

                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                  <Mic className="w-5 h-5 text-white/80" />
                </Button>

                <Button
                  onClick={async () => { await sendMessage(); userScrolledRef.current = false; setShowScrollButton(false); /* after sending, scroll to bottom */ setTimeout(() => { messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' }); }, 120); }}
                  disabled={!input.trim()}
                  size="icon"
                  className="bg-gradient-to-br from-pink-500 to-purple-600 hover:opacity-95 text-white rounded-full flex-shrink-0 w-10 h-10 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Griffin is thinking... ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;

