import { useState } from "react";
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
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! 💛 I'm Griffin, your AI study companion. How can I help you today?",
      timestamp: "10:30 AM",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, newMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: "I'm here to help! Let me think about that...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
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
