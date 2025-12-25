import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Target, Sparkles } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

const Welcome = () => {
  const navigate = useNavigate();
  // Use selected voice from localStorage if set
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  useEffect(() => {
    const v = localStorage.getItem("axios_voice");
    if (v) setSelectedVoice(v);
  }, []);
  const { speak, playClickSound } = useVoice(selectedVoice);

  const handleStartJourney = () => {
    playClickSound();
    speak("Welcome to Axios! Let's begin your journey to success!");
    setTimeout(() => navigate("/onboarding/profile"), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-warm/20 to-secondary/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        {/* Illustration */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-hero blur-3xl opacity-30 rounded-full" />
            <div className="relative bg-gradient-to-br from-primary/20 to-info/20 p-12 rounded-full">
              <Heart className="w-32 h-32 text-primary animate-float" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-foreground">
            Welcome to Griffin Ai💙
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Your worthy AI companion that helps you study smarter, stay organized, and reach your academic goals.
          </p>

          {/* Features */}
          <div className="grid gap-4 max-w-md mx-auto pt-8">
            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl shadow-card">
              <BookOpen className="w-8 h-8 text-info flex-shrink-0" />
              <p className="text-left text-sm">Personalized study plans based on your schedule</p>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl shadow-card">
              <Target className="w-8 h-8 text-success flex-shrink-0" />
              <p className="text-left text-sm">Smart reminders to keep you on track</p>
            </div>
            <div className="flex items-center gap-4 bg-card p-4 rounded-2xl shadow-card">
              <Sparkles className="w-8 h-8 text-warm flex-shrink-0" />
              <p className="text-left text-sm">AI-powered insights and motivation</p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-8">
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg rounded-full shadow-hover transition-all duration-300 hover:scale-105"
                onClick={handleStartJourney}
              >
                Start Your Journey
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-12 py-6 text-lg"
                onClick={() => navigate('/onboarding/login')}
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
