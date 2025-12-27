import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  MessageCircle,
  CheckCircle,
  XCircle,
  Send,
  Trophy,
  Star,
  Mic,
  Sparkles,
  Brain,
  Target,
  Zap,
} from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { apiUrl } from "@/lib/api";
import { FloatingAssistant } from "@/components/FloatingAssistant";

// Loader using loader.gif from public
const LoaderGif = () => (
  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 animate-pulse">
    <img
      src="/loader3.gif"
      alt="Loading..."
      className="w-10 h-10 rounded-full object-cover"
    />
  </span>
);

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

const StudySession = () => {
  const navigate = useNavigate();
  const { subject } = useParams();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || "Introduction";
  const { speak, playSuccessSound, playClickSound } = useVoice();

  const [activeTab, setActiveTab] = useState<"notes" | "chat" | "quiz">("notes");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm Griffin, your friendly assistant. Ask me anything about ${topic}!`,
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lastPendingQueryForNotes, setLastPendingQueryForNotes] = useState<string | null>(null);

  // Voice recognition for mic button
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
      const t = transcript.trim().toLowerCase();
      if (t.startsWith('griffin')) {
        const cleaned = transcript.replace(/^(griffin)\b[\,\s]*/i, '').trim();
        setTimeout(() => handleSendMessage(cleaned), 100);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);

  const generateQuiz = async (numQuestions = 5) => {
    const contextText = selectedNote?.note_text || notes;
    setQuizLoading(true);
    try {
      const res = await fetch(apiUrl("/api/llm/quiz"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: contextText, subject, topic, num_questions: numQuestions }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "LLM quiz generation failed");
      }
      const data = await res.json();
      if (data?.questions && Array.isArray(data.questions)) {
        const mapped: QuizQuestion[] = data.questions.map((q: any) => ({
          question: q.question || "",
          options: q.options || [],
          correct: typeof q.answer === 'number' ? q.answer : 0,
        }));
        setQuizQuestions(mapped);
        setQuizStarted(false);
        setQuizComplete(false);
        setCurrentQuestion(0);
        setActiveTab("quiz");
      } else {
        throw new Error("Invalid quiz format from LLM");
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to generate quiz: " + (e as any).toString() }]);
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem(`progress_${subject}`);
    if (savedProgress) {
      setProgress(parseInt(savedProgress));
    }
  }, [subject]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = (messageText !== undefined) ? messageText : inputMessage;
    if (!textToSend || !textToSend.trim()) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setChatLoading(true);

    const contextText = selectedNote?.note_text || notes;

    // If the user replies 'yes' to use local notes for the last pending query, retry with notes
    const q = textToSend.trim().toLowerCase();
    if ((q === 'yes' || q === 'use notes' || q === 'use my notes') && lastPendingQueryForNotes) {
      const retryText = lastPendingQueryForNotes;
      setChatLoading(true);
      setMessages((prev) => [...prev, { role: 'assistant', content: '__LOADING__' }]);
      try {
        const resp2 = await fetch(apiUrl('/api/llm/ask'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: retryText, context: contextText, subject: subject || '', topic }),
        });
        let answer2 = '';
        if (!resp2.ok) answer2 = "Sorry, there was a problem getting an answer from the assistant.";
        else {
          const data2 = await resp2.json();
          answer2 = data2?.answer || data2?.text || "I couldn't find an answer in your notes, but I can try generally.";
        }
        setMessages((prev) => {
          const msgs = prev.slice();
          const idx = msgs.findIndex((m) => m.content === '__LOADING__');
          if (idx !== -1) msgs.splice(idx, 1);
          if (answer2) speak(answer2);
          return [...msgs, { role: 'assistant', content: answer2 }];
        });
        setLastPendingQueryForNotes(null);
        return;
      } catch (e) {
        setMessages((prev) => {
          const msgs = prev.slice();
          const idx = msgs.findIndex((m) => m.content === '__LOADING__');
          if (idx !== -1) msgs.splice(idx, 1);
          return [...msgs, { role: 'assistant', content: 'Sorry, there was a problem getting an answer from the assistant.' }];
        });
        return;
      } finally {
        setChatLoading(false);
      }
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "__LOADING__" },
    ]);

    try {
      const res = await fetch(apiUrl("/api/llm/ask"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          context: contextText,
          subject: subject || "",
          topic,
        }),
      });
      let answer = "";
      if (!res.ok) {
        answer = "Sorry, there was a problem getting an answer from the assistant.";
      } else {
        const data = await res.json();
        answer = data.answer || data.text || "";
      }
      // If we got no useful answer, try asking the general LLM (no context)
      if (!answer || /no answer|couldn't find|i'm not sure|sorry/i.test(answer)) {
        try {
          const gen = await fetch(apiUrl('/api/llm/ask'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: textToSend, context: '' }),
          });
          if (gen.ok) {
            const gd = await gen.json();
            const genAnswer = gd?.answer || gd?.text || '';
            if (genAnswer && !/no answer/i.test(genAnswer)) answer = genAnswer;
          }
        } catch (e) {
          // ignore second-stage errors, we'll keep original answer
        }
      }

      setMessages((prev) => {
        const msgs = prev.slice();
        const idx = msgs.findIndex((m) => m.content === "__LOADING__");
        if (idx !== -1) msgs.splice(idx, 1);
        if (answer) speak(answer);
        return [...msgs, { role: "assistant", content: answer }];
      });
    } catch (err) {
      setMessages((prev) => {
        const msgs = prev.slice();
        const idx = msgs.findIndex((m) => m.content === "__LOADING__");
        if (idx !== -1) msgs.splice(idx, 1);
        return [...msgs, { role: "assistant", content: "Sorry, there was a problem getting an answer from the assistant." }];
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleStartQuiz = () => {
    playClickSound();
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setAnswered(null);
    setQuizComplete(false);
    speak("Let's test your knowledge! Good luck!");
  };

  const handleAnswer = (optionIndex: number) => {
    if (answered !== null) return;

    setAnswered(optionIndex);
    const isCorrect = optionIndex === quizQuestions[currentQuestion].correct;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
      playSuccessSound();
    }

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setAnswered(null);
      } else {
        setQuizComplete(true);
        const finalScore = isCorrect ? score + 1 : score;
        const newProgress = Math.min(100, progress + (finalScore / quizQuestions.length) * 20);
        setProgress(newProgress);
        localStorage.setItem(`progress_${subject}`, newProgress.toString());
        
        const overallProgress = localStorage.getItem("overallProgress");
        const currentOverall = overallProgress ? parseInt(overallProgress) : 0;
        const newOverall = Math.min(100, currentOverall + Math.floor((finalScore / quizQuestions.length) * 5));
        localStorage.setItem("overallProgress", newOverall.toString());
        
        if (finalScore >= 4) {
          speak("Excellent! You did amazing! Your progress has been updated!");
        } else if (finalScore >= 3) {
          speak("Good job! Keep practicing to improve!");
        } else {
          speak("Keep trying! Practice makes perfect!");
        }
      }
    }, 1500);
  };

  // State for user's uploaded notes
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        if (!subject) {
          setUserNotes([]);
          setSelectedNoteId(null);
          setNotesLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('course_name', subject)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching notes:', error);
          setUserNotes([]);
          setSelectedNoteId(null);
        } else if (data && data.length > 0) {
          setUserNotes(data);
          setSelectedNoteId(data[0].id);
        } else {
          setUserNotes([]);
          setSelectedNoteId(null);
        }
      } catch (e) {
        console.error('Error fetching notes:', e);
        setUserNotes([]);
        setSelectedNoteId(null);
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [subject]);

  const selectedNote = userNotes.find(n => n.id === selectedNoteId);
  let notes = "";
  if (selectedNote && selectedNote.note_text && String(selectedNote.note_text).trim().length > 0) {
    notes = selectedNote.note_text;
  } else if (userNotes.length > 0) {
    const firstWithText = userNotes.find(n => n.note_text && String(n.note_text).trim().length > 0);
    if (firstWithText) notes = firstWithText.note_text;
  }

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab !== "chat") return;
    const el = messagesContainerRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } catch (e) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleAssistantQuery = async (query: string): Promise<string> => {
    const contextText = selectedNote?.note_text || notes;
    try {
      const res = await fetch(apiUrl("/api/llm/ask"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          context: contextText,
          subject: subject || "",
          topic,
        }),
      });
      if (!res.ok) return "Sorry, I couldn't get an answer.";
      const data = await res.json();
      let answer = data.answer || data.text || '';

      // If no useful answer from notes-based query, try a general LLM call (no context)
      if (!answer || answer.trim() === '') {
        try {
          const gen = await fetch(apiUrl('/api/llm/ask'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: query, context: '' }),
          });
          if (gen.ok) {
            const gd = await gen.json();
            const genAnswer = gd?.answer || gd?.text || '';
            if (genAnswer && genAnswer.trim() !== '') {
              answer = genAnswer;
            }
          }
        } catch (e) {
          // ignore and fall through to fallback
        }
        if (!answer || answer.trim() === '') {
          const fallback = "I don't see local notes for that topic. I can still try to answer generally — would you like me to use your local notes to expand? Reply 'yes' to use them.";
          setLastPendingQueryForNotes(query);
          try { speak && speak(fallback, 1); } catch {}
          return fallback;
        }
      }

      return answer || "I'm not sure about that.";
    } catch (err) {
      console.error(err);
      return "Sorry, there was an error.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 pb-8">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-fade-in space-y-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-6 text-white shadow-xl">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{subject}</h1>
                <p className="text-white/80 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {topic}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{Math.round(progress)}%</div>
                <p className="text-white/80 text-xs">Progress</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative mt-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600/70">Notes</p>
                  <p className="font-bold text-blue-900">{userNotes.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-xl">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600/70">Quizzes</p>
                  <p className="font-bold text-purple-900">{quizQuestions.length > 0 ? 1 : 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-600/70">Score</p>
                  <p className="font-bold text-orange-900">{score}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 px-1">
            {[
              { id: "notes", label: "Notes", icon: BookOpen, color: "from-blue-500 to-cyan-500" },
              { id: "chat", label: "Ask AI", icon: MessageCircle, color: "from-purple-500 to-pink-500" },
              { id: "quiz", label: "Quiz", icon: Trophy, color: "from-orange-500 to-yellow-500" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => {
                    playClickSound();
                    setActiveTab(tab.id as any);
                  }}
                  className={`rounded-2xl gap-2 flex-shrink-0 px-6 py-6 transition-all ${
                    isActive 
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                      : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Content */}
          {activeTab === "notes" && (
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-3xl">
              {notesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoaderGif />
                  <span className="ml-3 text-muted-foreground">Loading notes...</span>
                </div>
              ) : userNotes.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {userNotes.map((note) => (
                      <Button
                        key={note.id}
                        variant={selectedNoteId === note.id ? "default" : "outline"}
                        size="sm"
                        className={`rounded-full transition-all ${
                          selectedNoteId === note.id 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0' 
                            : ''
                        }`}
                        onClick={() => {
                          playClickSound();
                          setSelectedNoteId(note.id);
                        }}
                      >
                        {note.title || note.filename || `Note ${note.id.slice(-4)}`}
                      </Button>
                    ))}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {notes.split("\n").map((line, i) => {
                      if (line.startsWith("# ")) {
                        return (
                          <h1 key={i} className="text-2xl font-bold text-foreground mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {line.replace("# ", "")}
                          </h1>
                        );
                      }
                      if (line.startsWith("## ")) {
                        return (
                          <h2 key={i} className="text-xl font-semibold text-foreground mt-6 mb-3">
                            {line.replace("## ", "")}
                          </h2>
                        );
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={i} className="text-lg font-medium text-foreground mt-4 mb-2">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <li key={i} className="text-muted-foreground ml-4 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                            {line.replace("- ", "")}
                          </li>
                        );
                      }
                      if (line.match(/^\d\. /)) {
                        return (
                          <li key={i} className="text-muted-foreground ml-4 list-decimal">
                            {line.replace(/^\d\. /, "")}
                          </li>
                        );
                      }
                      if (line.trim()) {
                        return (
                          <p key={i} className="text-muted-foreground mb-2">
                            {line}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Notes Found</h3>
                  <p className="text-muted-foreground text-sm">Upload notes from the Courses page to get started.</p>
                </div>
              )}
              
              <div className="mt-6 flex gap-3 flex-wrap">
                <Button
                  onClick={() => {
                    playClickSound();
                    setActiveTab("chat");
                  }}
                  className="rounded-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask Questions
                </Button>
                <Button
                  onClick={() => generateQuiz(5)}
                  disabled={quizLoading}
                  variant="outline"
                  className="rounded-full gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {quizLoading ? "Generating..." : "Generate Quiz"}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "chat" && (
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-3xl">
              <div className="space-y-4 h-[450px] flex flex-col">
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {msg.content === "__LOADING__" ? <LoaderGif /> : msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask anything about this topic..."
                    className="rounded-xl border-0 bg-white shadow-sm"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    size="icon"
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={startListening}
                    size="icon"
                    className={`rounded-xl ${isListening ? 'bg-red-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "quiz" && (
            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-3xl">
              {!quizStarted && !quizComplete ? (
                <div className="text-center space-y-6 py-8">
                  {quizQuestions.length === 0 ? (
                    <div className="space-y-4">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-semibold">No Quiz Yet</h3>
                      <p className="text-muted-foreground">Generate a quiz from your notes to test your knowledge.</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => generateQuiz(5)} className="rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
                          Generate 5 Questions
                        </Button>
                        <Button onClick={() => generateQuiz(10)} variant="outline" className="rounded-full">
                          Generate 10
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center animate-pulse">
                        <Trophy className="w-12 h-12 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Ready to Test?</h3>
                        <p className="text-muted-foreground">{quizQuestions.length} questions about {topic}</p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleStartQuiz} className="rounded-full gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 px-8">
                          <Star className="w-4 h-4" />
                          Start Quiz
                        </Button>
                        <Button onClick={() => generateQuiz(quizQuestions.length)} variant="outline" className="rounded-full">
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : quizComplete ? (
                <div className="text-center space-y-6 py-8">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Quiz Complete! 🎉</h3>
                    <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text">
                      {score}/{quizQuestions.length}
                    </p>
                    <p className="text-green-600 font-medium mt-2">
                      +{Math.floor((score / quizQuestions.length) * 20)}% progress added!
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                      className="rounded-full"
                    >
                      Back to Dashboard
                    </Button>
                    <Button onClick={handleStartQuiz} className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="rounded-full px-4 py-1">
                      Question {currentQuestion + 1} of {quizQuestions.length}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full px-4 py-1">
                      Score: {score}
                    </Badge>
                  </div>
                  <Progress
                    value={((currentQuestion + 1) / quizQuestions.length) * 100}
                    className="h-2"
                  />
                  <h3 className="text-xl font-semibold py-4">
                    {quizQuestions[currentQuestion].question}
                  </h3>
                  <div className="grid gap-3">
                    {quizQuestions[currentQuestion].options.map((option, i) => {
                      const isCorrect = i === quizQuestions[currentQuestion].correct;
                      const isSelected = answered === i;
                      let bgClass = "bg-white hover:bg-gray-50 border-gray-200";
                      
                      if (answered !== null) {
                        if (isCorrect) {
                          bgClass = "bg-green-50 border-green-400";
                        } else if (isSelected) {
                          bgClass = "bg-red-50 border-red-400";
                        }
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(i)}
                          disabled={answered !== null}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${bgClass} ${
                            answered === null ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center font-bold text-purple-600">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 font-medium">{option}</span>
                            {answered !== null && isCorrect && (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            )}
                            {answered !== null && isSelected && !isCorrect && (
                              <XCircle className="w-6 h-6 text-red-500" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
      
      <FloatingAssistant onQuery={handleAssistantQuery} />
    </div>
  );
};

export default StudySession;
