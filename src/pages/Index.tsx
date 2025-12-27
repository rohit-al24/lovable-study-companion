import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, TrendingUp, ArrowRight, Star, Zap, BookOpen } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import SplashScreen from "@/components/SplashScreen";

const Index = () => {
  const navigate = useNavigate();
  const { speak, playClickSound } = useVoice();
  const [showSplash, setShowSplash] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    // Check if splash was already shown this session
    const splashShown = sessionStorage.getItem('splash_shown');
    if (splashShown) {
      setShowSplash(false);
      setContentVisible(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
    setTimeout(() => setContentVisible(true), 100);
  };

  const handleGetStarted = () => {
    playClickSound();
    speak("Welcome! Let's start your learning journey!");
    setTimeout(() => {
      navigate("/welcome");
    }, 500);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={3500} />;
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Animated background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        }}
      >
        {/* Gradient orbs */}
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

        {/* Floating particles */}
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

      <div className={`relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col transition-all duration-1000 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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

        {/* Hero Section */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-12">
          {/* Left Content */}
          <div className="flex-1 max-w-xl space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/80">AI-Powered Learning</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="text-white">Study </span>
              <span 
                className="bg-clip-text text-transparent"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  WebkitBackgroundClip: 'text',
                }}
              >
                Smarter
              </span>
              <br />
              <span className="text-white">Not Harder</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-white/60 max-w-md mx-auto lg:mx-0">
              Your AI study companion that creates personalized plans, explains concepts, and helps you ace your exams.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="group px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                }}
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg rounded-2xl border-white/20 text-white hover:bg-white/10"
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-sm text-white/50">Students</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">4.9</p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">95%</p>
                <p className="text-sm text-white/50">Success</p>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="flex-1 max-w-md w-full">
            <div className="relative">
              {/* Glowing background */}
              <div 
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(240, 147, 251, 0.2))',
                  filter: 'blur(40px)',
                }}
              />

              {/* Cards Grid */}
              <div className="relative grid gap-4">
                {/* Card 1 */}
                <div 
                  className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-3 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      }}
                    >
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Smart Study Plans</h3>
                      <p className="text-sm text-white/60">AI creates personalized schedules based on your exams and learning style</p>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div 
                  className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-3 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                      }}
                    >
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Instant Explanations</h3>
                      <p className="text-sm text-white/60">Ask Griffin anything and get clear, easy-to-understand answers</p>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div 
                  className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-3 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                      }}
                    >
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Track Progress</h3>
                      <p className="text-sm text-white/60">Visualize your growth with detailed analytics and insights</p>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div 
                  className="p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-3 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #43e97b, #38f9d7)',
                      }}
                    >
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Smart Quizzes</h3>
                      <p className="text-sm text-white/60">Auto-generated quizzes from your notes to test your knowledge</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-sm text-white/40">
            Join thousands of students studying smarter with Griffin AI
          </p>
        </footer>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

export default Index;
