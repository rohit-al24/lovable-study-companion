import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Calendar, Plus, X } from "lucide-react";

interface Exam {
  subject: string;
  date: string;
}

const ExamSchedule = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([{ subject: "", date: "" }]);

  const addExam = () => {
    setExams([...exams, { subject: "", date: "" }]);
  };

  const removeExam = (index: number) => {
    if (exams.length > 1) {
      setExams(exams.filter((_, i) => i !== index));
    }
  };

  const updateExam = (index: number, field: keyof Exam, value: string) => {
    const updated = [...exams];
    updated[index][field] = value;
    setExams(updated);
  };

  const handleContinue = () => {
    navigate("/onboarding/finish");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-info/20 to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step 3 of 4</span>
            <span>75% Complete</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>

        <Card className="p-8 shadow-soft">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/onboarding/preferences")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Exam Schedule</h2>
              <p className="text-muted-foreground">
                Add your upcoming exams so we can plan your study schedule
              </p>
            </div>

            {/* Upload Option */}
            <div className="p-6 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 transition-colors cursor-pointer bg-muted/20">
              <div className="text-center space-y-3">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-foreground">Upload Exam Timetable</p>
                  <p className="text-sm text-muted-foreground">
                    Or add exams manually below
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Manual Entry
              </Label>

              {exams.map((exam, index) => (
                <div key={index} className="flex gap-3 animate-slide-up">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Subject name"
                      value={exam.subject}
                      onChange={(e) => updateExam(index, "subject", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="date"
                      value={exam.date}
                      onChange={(e) => updateExam(index, "date", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  {exams.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExam(index)}
                      className="rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addExam}
                className="w-full rounded-xl border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Exam
              </Button>
            </div>

            <Button
              onClick={handleContinue}
              size="lg"
              disabled={!exams.some((e) => e.subject && e.date)}
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

export default ExamSchedule;
