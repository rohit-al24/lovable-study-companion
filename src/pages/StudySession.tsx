import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

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
      content: `Hi! I'm here to help you with ${subject}. Ask me anything about ${topic}!`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
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

  const quizQuestions: QuizQuestion[] = [
    {
      question: `What is the main concept of ${topic}?`,
      options: [
        "Understanding basic principles",
        "Memorizing formulas only",
        "Skipping fundamentals",
        "Random guessing",
      ],
      correct: 0,
    },
    {
      question: `Which approach is best for studying ${subject}?`,
      options: [
        "Never practice",
        "Practice regularly with examples",
        "Only read theory",
        "Ignore difficult topics",
      ],
      correct: 1,
    },
    {
      question: `What should you do after solving a ${subject} problem?`,
      options: [
        "Move on immediately",
        "Delete your work",
        "Verify your answer",
        "Skip checking",
      ],
      correct: 2,
    },
    {
      question: `How can you improve your understanding of ${topic}?`,
      options: [
        "Never ask questions",
        "Avoid practice problems",
        "Only study before exams",
        "Draw diagrams and visualize concepts",
      ],
      correct: 3,
    },
    {
      question: `What's the best time management strategy for ${subject}?`,
      options: [
        "Study consistently every day",
        "Cram everything last minute",
        "Never review",
        "Skip difficult chapters",
      ],
      correct: 0,
    },
  ];

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem(`progress_${subject}`);
    if (savedProgress) {
      setProgress(parseInt(savedProgress));
    }
  }, [subject]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `Great question about ${topic}! Let me explain...`,
        `That's an important concept in ${subject}. Here's how it works...`,
        `I'd be happy to help you understand ${topic} better. The key thing to remember is...`,
        `Excellent curiosity! In ${subject}, this concept relates to...`,
      ];
      const response: Message = {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
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

  const notes = sampleNotes[subject as keyof typeof sampleNotes] || sampleNotes.Mathematics;

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
              <Button
                onClick={() => {
                  playClickSound();
                  setActiveTab("chat");
                }}
                className="mt-6 rounded-full gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Have Questions? Ask Lovable
              </Button>
            </Card>
          )}

          {activeTab === "chat" && (
            <Card className="p-6 shadow-card">
              <div className="space-y-4 h-[400px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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
                        {msg.content}
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
                </div>
              </div>
            </Card>
          )}

          {activeTab === "quiz" && (
            <Card className="p-6 shadow-card">
              {!quizStarted && !quizComplete ? (
                <div className="text-center space-y-6 py-8">
                  <div className="bg-gradient-to-br from-primary/20 to-warm/20 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Ready for a Quiz?</h3>
                    <p className="text-muted-foreground">
                      Test your knowledge of {topic} with {quizQuestions.length} questions
                    </p>
                  </div>
                  <Button onClick={handleStartQuiz} className="rounded-full gap-2">
                    <Star className="w-4 h-4" />
                    Start Quiz
                  </Button>
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
    </div>
  );
};

export default StudySession;
