import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Brain, TrendingUp } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

const Index = () => {
  const navigate = useNavigate();
  const { speak, playClickSound } = useVoice();

  const handleGetStarted = () => {
    playClickSound();
    speak("Great choice! Let's get started on your learning adventure!");
    setTimeout(() => {
      navigate("/welcome");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-info/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-hero p-6 rounded-3xl shadow-soft animate-float">
              <Heart className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Hero Title */}
          <h1 className="text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            GRIFFIN
          </h1>
          <p className="text-2xl text-muted-foreground">
            Your worthy AI study companion
          </p>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card p-6 rounded-2xl shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
              <Brain className="w-12 h-12 text-info mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Smart Planning</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered study schedules tailored to your exams
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
              <Sparkles className="w-12 h-12 text-warm mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Personal Mentor</h3>
              <p className="text-sm text-muted-foreground">
                Get instant help and explanations when you need them
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
              <TrendingUp className="w-12 h-12 text-success mb-4 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Visualize your growth and celebrate achievements
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-8">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg rounded-full shadow-hover transition-all duration-300 hover:scale-105"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            Join thousands of students studying smarter, not harder
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
