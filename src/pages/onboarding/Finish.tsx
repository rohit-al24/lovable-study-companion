import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Heart, TrendingUp, Calendar } from "lucide-react";

const Finish = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-success/20 to-warm/20 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step 4 of 4</span>
            <span>100% Complete</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        <Card className="p-8 shadow-soft text-center space-y-8">
          {/* Celebration Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-success blur-2xl opacity-40 rounded-full animate-pulse" />
              <div className="relative bg-gradient-success p-8 rounded-full">
                <Sparkles className="w-20 h-20 text-white animate-float" />
              </div>
            </div>
          </div>

          {/* Congratulations */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              You're All Set! 🎉
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Lovable has created a personalized study plan just for you. Let's start this journey together!
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid gap-4 max-w-md mx-auto pt-4">
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl">
              <Calendar className="w-8 h-8 text-info flex-shrink-0" />
              <p className="text-left text-sm font-medium">
                Your personalized study schedule is ready
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-success flex-shrink-0" />
              <p className="text-left text-sm font-medium">
                Track progress with detailed analytics
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl">
              <Heart className="w-8 h-8 text-primary flex-shrink-0" />
              <p className="text-left text-sm font-medium">
                Chat with Lovable anytime for help
              </p>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full shadow-hover transition-all duration-300 hover:scale-105 mt-8"
          >
            Take Me to Dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Finish;
