import { useState, useEffect, useRef } from "react";
// Loader using loader.gif from public
const LoaderGif = () => (
  <span style={{
    width: 64,
    height: 64,
    display: 'inline-block',
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 0 0 2px #e0e0e0',
  }}>
    <img
      src="/loader3.gif"
      alt="Loading..."
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%',
        display: 'block',
      }}
    />
  </span>
);
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { apiUrl } from "@/lib/api";

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
  // ...existing code...
  const { speak, playSuccessSound, playClickSound } = useVoice();

  const [activeTab, setActiveTab] = useState<"notes" | "chat" | "quiz">("notes");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm Axios, your study companion. Ask me anything about ${topic}!`,
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [liveAssistantOn, setLiveAssistantOn] = useState(false);
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const assistantTimeoutRef = useRef<number | null>(null);
  const [assistantPos, setAssistantPos] = useState<{x:number,y:number}>({ x: window.innerWidth - 84, y: window.innerHeight - 120 });
  const dragRef = useRef<{dragging:boolean, startX:number, startY:number, originX:number, originY:number}>({ dragging:false, startX:0, startY:0, originX:0, originY:0 });
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
        // If user says wake word at start, auto-send (accept only Griffin)
        const t = transcript.trim().toLowerCase();
        if (t.startsWith('griffin')) {
          // remove wake word and send the rest
          const cleaned = transcript.replace(/^(griffin)\b[\,\s]*/i, '').trim();
          setTimeout(() => handleSendMessage(cleaned), 100);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    };

    // Background wake-word listener when Live Assistant is enabled
    useEffect(() => {
      if (!liveAssistantOn) {
        // stop any existing background recognition
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
          recognitionRef.current = null;
        }
        return;
      }

      if (!('webkitSpeechRecognition' in window)) {
        console.warn('Speech recognition not supported in this browser. Live assistant disabled.');
        return;
      }

      const rec = new (window as any).webkitSpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN';

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

        // detect wake word 'griffin' only
        const lowered = text.toLowerCase();
        if (lowered.includes('griffin')) {
          // prepare query by removing wake word
          const cleaned = text.replace(/griffin/ig, '').trim();
          // activate assistant UI briefly
          setIsAssistantActive(true);
          setActiveTab('chat');
          // set transcript into input (simulate typing)
          setInputMessage(cleaned);
          // if final result present, send automatically after short delay
          if (final) {
            // small delay to allow user to hear expansion
            if (assistantTimeoutRef.current) window.clearTimeout(assistantTimeoutRef.current);
            assistantTimeoutRef.current = window.setTimeout(() => {
              handleSendMessage(cleaned);
              // hide active state after a moment
              setTimeout(() => setIsAssistantActive(false), 800);
            }, 600);
          }
        }
      };

      rec.onerror = (e:any) => {
        console.warn('Live assistant recognition error', e);
      };

      rec.onend = () => {
        // restart to keep listening
        try { rec.start(); } catch (e) {}
      };

      recognitionRef.current = rec;
      try { rec.start(); } catch (e) { console.warn('Could not start live recognition', e); }

      return () => {
        try { recognitionRef.current && recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
        if (assistantTimeoutRef.current) { window.clearTimeout(assistantTimeoutRef.current); assistantTimeoutRef.current = null; }
      };
    }, [liveAssistantOn]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const sampleNotes = {
    Mathematics: `# ${topic}

## Key Concepts

### Definition
${topic} is a fundamental concept in Mathematics that helps us understand complex relationships between numbers and functions.

### Important Formulas
- Formula 1: ∫f(x)dx = F(x) + C
- Formula 2: d/dx[f(x)] = f'(x)
- Formula 3: lim(x→a) f(x) = L

### Steps to Solve
1. Identify the type of problem
2. Apply the appropriate formula
3. Simplify the expression
4. Verify your answer

### Tips to Remember
- Always check your limits
- Practice with various examples
- Draw graphs when possible`,
    Physics: `# ${topic}

## Key Concepts

### Laws of Thermodynamics
1. **First Law**: Energy cannot be created or destroyed
2. **Second Law**: Entropy always increases
3. **Third Law**: Absolute zero is unattainable

### Important Equations
- ΔU = Q - W
- S = k ln(W)
- PV = nRT

### Application Examples
- Heat engines
- Refrigerators
- Phase transitions`,
    Chemistry: `# ${topic}

## Organic Chemistry Basics

### Functional Groups
- Alcohols (-OH)
- Aldehydes (-CHO)
- Ketones (C=O)
- Carboxylic Acids (-COOH)

### Naming Conventions
1. Find the longest carbon chain
2. Number from the end nearest to substituent
3. Name substituents with position numbers`,
  };

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

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    // Load progress from localStorage
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

    // Use the selected note's text as context for the LLM
    const contextText = selectedNote?.note_text || notes;

    // Show Siri loader as a temporary assistant message
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
        // Optionally, you can define getExcerpt here if you want to show an excerpt from notes
        answer = "Sorry, there was a problem getting an answer from the study assistant.";
      } else {
        const data = await res.json();
        answer = data.answer;
      }
      setMessages((prev) => {
        // Remove the last __LOADING__ message and add the real answer
        const msgs = prev.slice();
        const idx = msgs.findIndex((m) => m.content === "__LOADING__");
        if (idx !== -1) msgs.splice(idx, 1);
        // Speak the reply aloud
        if (answer) speak(answer);
        return [...msgs, { role: "assistant", content: answer }];
      });
    } catch (err) {
      setMessages((prev) => {
        const msgs = prev.slice();
        const idx = msgs.findIndex((m) => m.content === "__LOADING__");
        if (idx !== -1) msgs.splice(idx, 1);
        return [...msgs, { role: "assistant", content: "Sorry, there was a problem getting an answer from the study assistant." }];
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
        // Quiz complete
        setQuizComplete(true);
        const finalScore = isCorrect ? score + 1 : score;
        const newProgress = Math.min(100, progress + (finalScore / quizQuestions.length) * 20);
        setProgress(newProgress);
        localStorage.setItem(`progress_${subject}`, newProgress.toString());
        
        // Update overall progress
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

  // Fetch notes for this subject (course)
  useEffect(() => {
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        // Get user id from supabase auth
        const { data: userData } = await import("@/lib/supabaseClient").then(m => m.supabase.auth.getUser());
        const uid = (userData as any)?.user?.id || null;
        if (!uid || !subject) return;
        // Fetch notes for this user and course
        const { data, error } = await import("@/lib/supabaseClient").then(m => m.supabase
          .from('notes')
          .select('*')
          .eq('user_id', uid)
          .eq('course_name', subject)
          .order('created_at', { ascending: false })
        );
        if (!error && data) {
          setUserNotes(data);
          if (data.length > 0) setSelectedNoteId(data[0].id);
        }
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [subject]);

  // Find selected note text
  const selectedNote = userNotes.find(n => n.id === selectedNoteId);
  const notes = selectedNote?.note_text || (sampleNotes[subject as keyof typeof sampleNotes] || sampleNotes.Mathematics);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-info/10 pb-8">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{subject}</h1>
              <p className="text-sm text-muted-foreground">{topic}</p>
            </div>
            <Badge variant="secondary" className="bg-primary/20">
              Progress: {Math.round(progress)}%
            </Badge>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "notes", label: "Notes", icon: BookOpen },
              { id: "chat", label: "Ask Questions", icon: MessageCircle },
              { id: "quiz", label: "Take Quiz", icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => {
                    playClickSound();
                    setActiveTab(tab.id as any);
                  }}
                  className="rounded-full gap-2 flex-shrink-0"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Content */}
          {activeTab === "notes" && (
            <Card className="p-6 shadow-card">
              {/* Note selector buttons */}
              {notesLoading ? (
                <div className="mb-4 text-muted-foreground">Loading notes...</div>
              ) : userNotes.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {userNotes.map((note) => (
                    <Button
                      key={note.id}
                      variant={selectedNoteId === note.id ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        playClickSound();
                        setSelectedNoteId(note.id);
                      }}
                    >
                      {note.title || note.filename || `Note ${note.id.slice(-4)}`}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="mb-4 text-muted-foreground">No uploaded notes found for this course. Showing sample notes.</div>
              )}
              <div className="prose prose-sm max-w-none">
                {notes.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) {
                    return (
                      <h1 key={i} className="text-2xl font-bold text-foreground mb-4">
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
                      <li key={i} className="text-muted-foreground ml-4">
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
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => {
                    playClickSound();
                    setActiveTab("chat");
                  }}
                  className="rounded-full gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Have Questions? Ask Lovable
                </Button>
                <Button
                  onClick={() => generateQuiz(5)}
                  disabled={quizLoading}
                  className="rounded-full gap-2"
                >
                  {quizLoading ? "Generating..." : "Generate Quiz"}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "chat" && (
            <Card className="p-6 shadow-card">
              <div className="space-y-4 h-[400px] flex flex-col">
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.content === "__LOADING__" ? <LoaderGif /> : msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask a question about this topic..."
                    className="rounded-full"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="rounded-full"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={startListening}
                    size="icon"
                    className={`rounded-full ${isListening ? 'bg-primary/20' : ''}`}
                    title="Speak to Lovable"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "quiz" && (
            <Card className="p-6 shadow-card">
              {!quizStarted && !quizComplete ? (
                <div className="text-center space-y-6 py-8">
                  {quizQuestions.length === 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">No quiz generated yet</h3>
                      <p className="text-muted-foreground">Use the Notes tab to generate a quiz from your uploaded notes.</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => generateQuiz(5)} className="rounded-full">Generate 5</Button>
                        <Button onClick={() => generateQuiz(10)} className="rounded-full">Generate 10</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6 py-8">
                      <div className="bg-gradient-to-br from-primary/20 to-warm/20 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Ready for a Quiz?</h3>
                        <p className="text-muted-foreground">Test your knowledge of {topic} with {quizQuestions.length} questions</p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleStartQuiz} className="rounded-full gap-2">
                          <Star className="w-4 h-4" />
                          Start Quiz
                        </Button>
                        <Button onClick={() => generateQuiz(quizQuestions.length)} className="rounded-full">Regenerate</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : quizComplete ? (
                <div className="text-center space-y-6 py-8">
                  <div className="bg-gradient-to-br from-success/20 to-primary/20 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-success" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Quiz Complete! 🎉</h3>
                    <p className="text-lg text-muted-foreground">
                      You scored {score}/{quizQuestions.length}
                    </p>
                    <p className="text-success font-medium mt-2">
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
                    <Button onClick={handleStartQuiz} className="rounded-full">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestion + 1} of {quizQuestions.length}
                    </span>
                    <Badge variant="secondary">Score: {score}</Badge>
                  </div>
                  <Progress
                    value={((currentQuestion + 1) / quizQuestions.length) * 100}
                    className="h-2"
                  />
                  <h3 className="text-xl font-semibold">
                    {quizQuestions[currentQuestion].question}
                  </h3>
                  <div className="grid gap-3">
                    {quizQuestions[currentQuestion].options.map((option, i) => {
                      const isCorrect = i === quizQuestions[currentQuestion].correct;
                      const isSelected = answered === i;
                      let bgClass = "bg-card hover:bg-muted";
                      
                      if (answered !== null) {
                        if (isCorrect) {
                          bgClass = "bg-success/20 border-success";
                        } else if (isSelected) {
                          bgClass = "bg-destructive/20 border-destructive";
                        }
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswer(i)}
                          disabled={answered !== null}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${bgClass} ${
                            answered === null ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {answered !== null && isCorrect && (
                              <CheckCircle className="w-5 h-5 text-success" />
                            )}
                            {answered !== null && isSelected && !isCorrect && (
                              <XCircle className="w-5 h-5 text-destructive" />
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
        {/* Floating Live Assistant Toggle Button */}
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
    </div>
  );
};

export default StudySession;
