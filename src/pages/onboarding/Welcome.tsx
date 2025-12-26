import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, Sparkles, ArrowRight, MessageCircle, Calendar, Trophy } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";

const Welcome = () => {
  const navigate = useNavigate();
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState(0);
  
  useEffect(() => {
    const v = localStorage.getItem("griffin_voice");
    if (v) setSelectedVoice(v);
  }, []);
  
  const { speak, playClickSound } = useVoice(selectedVoice);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: "Smart Notes",
      description: "Upload your PDFs and let AI organize your study material",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: MessageCircle,
      title: "AI Tutor",
      description: "Ask questions anytime and get instant explanations",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Calendar,
      title: "Study Planner",
      description: "Personalized schedules tailored to your exams",
      gradient: "from-orange-500 to-yellow-500",
    },
    {
      icon: Trophy,
      title: "Practice Quizzes",
      description: "Test your knowledge with AI-generated questions",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const handleStartJourney = () => {
    playClickSound();
    speak("Excellent! Let's set up your profile.");
    setTimeout(() => navigate("/onboarding/profile"), 600);
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        {/* Animated gradient orbs */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.6) 0%, transparent 70%)',
            top: '-15%',
            right: '-10%',
            filter: 'blur(80px)',
            animation: 'pulse-orb 6s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(240, 147, 251, 0.6) 0%, transparent 70%)',
            bottom: '-5%',
            left: '-10%',
            filter: 'blur(60px)',
            animation: 'pulse-orb 8s ease-in-out infinite reverse',
          }}
        />

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
              <img src="/loader3.gif" alt="Griffin" className="w-full h-full rounded-xl object-cover" />
            </div>
            <span className="text-xl font-bold text-white">Griffin</span>
          </div>
          <Button 
            variant="ghost" 
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => navigate('/onboarding/login')}
          >
            Sign In
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-8">
          {/* Left Side - Welcome Message */}
          <div className="flex-1 max-w-lg space-y-8 text-center lg:text-left">
            {/* Animated mascot */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(240, 147, 251, 0.4))',
                    filter: 'blur(30px)',
                    animation: 'pulse-orb 3s ease-in-out infinite',
                  }}
                />
                <div 
                  className="relative w-32 h-32 rounded-full overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    padding: '3px',
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                    <img 
                      src="/loader3.gif" 
                      alt="Griffin AI" 
                      className="w-full h-full object-cover"
                      style={{ filter: 'brightness(1.1)' }}
                    />
                  </div>
                </div>
                <Sparkles 
                  className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400"
                  style={{ animation: 'sparkle 2s ease-in-out infinite' }}
                />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold">
                <span className="text-white">Welcome to </span>
                <span 
                  className="bg-clip-text text-transparent"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  Griffin AI
                </span>
              </h1>
              <p className="text-lg text-white/60">
                Your personal AI study companion that adapts to your learning style and helps you achieve academic success.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg"
                onClick={handleStartJourney}
                className="group px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                }}
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/onboarding/login')}
                className="px-8 py-6 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10"
              >
                I Have an Account
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-6 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                No credit card
              </div>
            </div>
          </div>

          {/* Right Side - Feature Showcase */}
          <div className="flex-1 max-w-md w-full">
            <div className="relative">
              {/* Feature Cards */}
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isActive = activeFeature === index;
                  return (
                    <div
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`p-5 rounded-2xl cursor-pointer transition-all duration-500 ${
                        isActive ? 'scale-105' : 'scale-100 opacity-60 hover:opacity-80'
                      }`}
                      style={{
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        border: isActive 
                          ? '1px solid rgba(255,255,255,0.2)' 
                          : '1px solid rgba(255,255,255,0.05)',
                        boxShadow: isActive 
                          ? '0 20px 40px rgba(0,0,0,0.3)' 
                          : 'none',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} transition-transform duration-300 ${
                            isActive ? 'scale-110' : ''
                          }`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                          <p className={`text-sm transition-all duration-300 ${
                            isActive ? 'text-white/70 max-h-20' : 'text-white/40 max-h-0 overflow-hidden'
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                        {isActive && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: 'linear-gradient(135deg, #667eea, #f093fb)',
                              boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mt-6">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeFeature === index 
                        ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' 
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-orb {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(15deg); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
