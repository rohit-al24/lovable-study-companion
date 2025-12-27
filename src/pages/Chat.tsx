import { useState, useEffect } from "react";
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

  // Load recent conversations from Supabase (if signed in)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = (userData as any)?.user?.id || null;
        if (!uid) {
          // seed with greeting
          if (mounted) setMessages([{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your AI study companion. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
          return;
        }
        const { data } = await supabase.from('conversations').select('question,answer,context,metadata,created_at').eq('user_id', uid).order('id', { ascending: false }).limit(50);
        if (!mounted) return;
        if (!data || data.length === 0) {
          setMessages([{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your AI study companion. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
          return;
        }
        const rows = (data as any[]).slice().reverse();
        const msgs: Message[] = [];
        for (const r of rows) {
          if (r.question) msgs.push({ role: 'user', content: r.question, timestamp: new Date(r.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
          if (r.answer) msgs.push({ role: 'assistant', content: r.answer, timestamp: new Date(r.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), source: r.context ? 'notes' : (r.metadata?.source || null) });
        }
        setMessages(msgs.length ? msgs : [{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your AI study companion. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      } catch (e) {
        console.warn('Failed loading conversations', e);
        if (mounted) setMessages([{ role: 'assistant', content: "Hi there! 💛 I'm Griffin, your AI study companion. How can I help you today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
      // Prefer general LLM (Ollama) first for open questions; fall back to user's notes if needed
      let answer = '';
      let source: string | null = null;
      let notesContext = '';

      try {
        // 1) General LLM call (no context)
        try {
          const respGen = await fetch(apiUrl('/api/llm/ask'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, context: '' }),
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
              const resp = await fetch(apiUrl('/api/llm/ask'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, context: notesContext }),
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-warm/10 pb-20 md:pb-8 md:pt-20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl h-[calc(100vh-12rem)] flex flex-col">
        <div className="animate-fade-in flex flex-col h-full">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-hero rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Chat with Griffin</h1>
                <p className="text-sm text-muted-foreground">Your caring AI study assistant</p>
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-slide-up ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className={`w-10 h-10 ${message.role === "assistant" ? "bg-gradient-hero" : "bg-muted"}`}>
                  {message.role === "assistant" ? (
                    <Heart className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-medium">A</span>
                  )}
                </Avatar>

                <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[75%]`}>
                  <Card
                    className={`p-4 shadow-card ${
                      message.role === "assistant"
                        ? "bg-gradient-to-br from-secondary/50 to-info/20"
                        : "bg-card"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.role === 'assistant' && message.source && (
                      <div className="mt-2">
                        <span className={`inline-block text-[10px] px-2 py-1 rounded-full ${message.source === 'notes' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {message.source === 'notes' ? 'Notes' : 'General'}
                        </span>
                      </div>
                    )}
                  </Card>
                  <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <Card className="p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                <Upload className="w-5 h-5" />
              </Button>

              <Input
                placeholder="Ask Griffin anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 border-none bg-transparent focus-visible:ring-0"
              />

              <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                <Mic className="w-5 h-5" />
              </Button>

              <Button
                onClick={sendMessage}
                disabled={!input.trim()}
                size="icon"
                className="bg-primary hover:bg-primary/90 text-white rounded-full flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Griffin is thinking... ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
