import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 3000 }) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 800);
    const timer2 = setTimeout(() => setPhase('fade'), duration - 500);
    const timer3 = setTimeout(() => onComplete(), duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [duration, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-500 ${
        phase === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 100}, 255, ${Math.random() * 0.5 + 0.2})`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Glow effect behind logo */}
      <div 
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.2) 40%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      />

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo Container */}
        <div 
          className="relative"
          style={{
            animation: phase === 'logo' ? 'logo-enter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : undefined,
          }}
        >
          {/* Outer ring */}
          <div 
            className="absolute -inset-4 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb, #667eea)',
              backgroundSize: '300% 300%',
              animation: 'gradient-rotate 3s linear infinite',
              opacity: 0.6,
              filter: 'blur(8px)',
            }}
          />
          
          {/* Inner ring */}
          <div 
            className="absolute -inset-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              animation: 'ring-pulse 2s ease-in-out infinite',
            }}
          />

          {/* Logo image */}
          <div 
            className="relative w-32 h-32 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              boxShadow: '0 0 60px rgba(102, 126, 234, 0.5), inset 0 0 30px rgba(102, 126, 234, 0.2)',
            }}
          >
            <img 
              src="/loader3.gif" 
              alt="Griffin AI" 
              className="w-full h-full object-cover"
              style={{
                filter: 'brightness(1.1) saturate(1.2)',
              }}
            />
          </div>

          {/* Sparkle decorations */}
          <Sparkles 
            className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400"
            style={{ animation: 'sparkle 1.5s ease-in-out infinite' }}
          />
          <Sparkles 
            className="absolute -bottom-1 -left-3 w-4 h-4 text-pink-400"
            style={{ animation: 'sparkle 1.5s ease-in-out infinite 0.5s' }}
          />
        </div>

        {/* Text */}
        <div 
          className={`text-center transition-all duration-700 ${
            phase === 'logo' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <h1 
            className="text-5xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #fff 0%, #c7d2fe 50%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(167, 139, 250, 0.5)',
            }}
          >
            Griffin
          </h1>
          <p 
            className="text-lg tracking-widest uppercase"
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.3em',
            }}
          >
            AI Study Companion
          </p>
        </div>

        {/* Loading bar */}
        <div 
          className={`w-48 h-1 rounded-full overflow-hidden transition-opacity duration-500 ${
            phase === 'logo' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div 
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb)',
              animation: 'loading-bar 2s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes logo-enter {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes gradient-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.6; }
        }
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-15px) translateX(3px); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
