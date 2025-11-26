import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Eye, FileText, HelpCircle, Sparkles } from "lucide-react";

const Preferences = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    studyHours: 4,
    studyStyle: [] as string[],
    sundaysFree: true,
  });

  const studyStyles = [
    { id: "visual", label: "Visual", icon: Eye },
    { id: "notes", label: "Notes Summary", icon: FileText },
    { id: "practice", label: "Practice Questions", icon: HelpCircle },
    { id: "mixed", label: "Mixed", icon: Sparkles },
  ];

  const toggleStyle = (style: string) => {
    setPreferences((prev) => ({
      ...prev,
      studyStyle: prev.studyStyle.includes(style)
        ? prev.studyStyle.filter((s) => s !== style)
        : [...prev.studyStyle, style],
    }));
  };

  const handleContinue = () => {
    navigate("/onboarding/exam-schedule");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-success/20 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step 2 of 4</span>
            <span>50% Complete</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>

        <Card className="p-8 shadow-soft">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/onboarding/profile")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Study Preferences</h2>
              <p className="text-muted-foreground">
                Help us customize your study plan to match your style
              </p>
            </div>

            {/* Study Hours */}
            <div className="space-y-4">
              <Label>Preferred Study Hours Per Day</Label>
              <div className="flex gap-3">
                {[2, 3, 4, 5, 6].map((hours) => (
                  <Button
                    key={hours}
                    variant={preferences.studyHours === hours ? "default" : "outline"}
                    className={`flex-1 rounded-xl ${
                      preferences.studyHours === hours
                        ? "bg-primary text-white"
                        : "hover:bg-secondary"
                    }`}
                    onClick={() => setPreferences({ ...preferences, studyHours: hours })}
                  >
                    {hours}h
                  </Button>
                ))}
              </div>
            </div>

            {/* Study Style */}
            <div className="space-y-4">
              <Label>Preferred Study Style (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-4">
                {studyStyles.map((style) => {
                  const Icon = style.icon;
                  const isSelected = preferences.studyStyle.includes(style.id);
                  return (
                    <button
                      key={style.id}
                      onClick={() => toggleStyle(style.id)}
                      className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 mx-auto mb-3 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <p
                        className={`font-medium ${
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {style.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sunday Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
              <div className="space-y-1">
                <Label htmlFor="sundays-free">Keep Sundays Free</Label>
                <p className="text-sm text-muted-foreground">
                  No study sessions scheduled on Sundays
                </p>
              </div>
              <Switch
                id="sundays-free"
                checked={preferences.sundaysFree}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, sundaysFree: checked })
                }
              />
            </div>

            <Button
              onClick={handleContinue}
              size="lg"
              disabled={preferences.studyStyle.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full shadow-card transition-all duration-300 hover:shadow-hover"
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Preferences;
