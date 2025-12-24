import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    degree: "",
    semester: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/onboarding/preferences");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-info/20 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step 1 of 3</span>
            <span>33% Complete</span>
          </div>
          <Progress value={33} className="h-2" />
        </div>

        {/* Card */}
        <Card className="p-8 shadow-soft">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/welcome")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground">About You</h2>
              <p className="text-muted-foreground">
                Let's get to know you better so we can personalize your experience
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Alex"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college">College / School</Label>
                <Input
                  id="college"
                  placeholder="University of Example"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">Degree / Class</Label>
                <Input
                  id="degree"
                  placeholder="B.Sc Computer Science"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Current Semester</Label>
                <Input
                  id="semester"
                  type="number"
                  placeholder="3"
                  min="1"
                  max="12"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full shadow-card transition-all duration-300 hover:shadow-hover"
              >
                Continue
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
