import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  // Use selected voice from localStorage if set
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  useEffect(() => {
    const v = localStorage.getItem("axios_voice");
    if (v) setSelectedVoice(v);
  }, []);
  const { speak, playClickSound } = useVoice(selectedVoice);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    college: "",
    degree: "",
    semester: "1",
  });
  const [loading, setLoading] = useState(false);

  const handleNameBlur = () => {
    if (formData.name.trim()) {
      const firstName = formData.name.trim().split(' ')[0];
      speak(`Welcome, ${firstName}! We're excited to have you join us!`);
    }
  };

  const handleCollegeBlur = () => {
    if (formData.college.trim()) {
      speak(`Awesome! ${formData.college} sounds like a fantastic place to learn!`);
    }
  };

  const handleDegreeBlur = () => {
    if (formData.degree.trim()) {
      speak(`Wow, studying ${formData.degree} sounds exciting! Keep it up!`);
    }
  };

  const handleSemesterBlur = () => {
    if (formData.semester.trim()) {
      speak(`You're in semester ${formData.semester}. Let's make this one your best yet!`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setLoading(true);
    // Register user with Supabase Auth
    try {
      const { email, password, name, college, degree, semester } = formData;
      if (!email || !password) {
        toast({ title: 'Missing fields', description: 'Email and password are required.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      // Password length validation
      if (password.length < 6) {
        toast({ title: 'Weak password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        let description = signUpError.message;
        if (description.toLowerCase().includes('user already registered')) {
          description += ' Please log in instead.';
        }
        toast({ title: 'Registration failed', description, variant: 'destructive' });
        setLoading(false);
        return;
      }
      const userId = signUpData?.user?.id;
      if (!userId) {
        toast({ title: 'Registration error', description: 'No user ID returned.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      // Save profile to Supabase profiles table
      const payload = {
        id: userId,
        user_id: userId,
        email,
        name,
        college,
        degree,
        semester,
      };
      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      } else {
        speak("Excellent! Let's set up your study preferences!");
        setTimeout(() => {
          navigate("/onboarding/preferences");
        }, 500);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Could not register or save profile.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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
            onClick={() => {
              playClickSound();
              navigate("/welcome");
            }}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Setup Profile</h2>
              <p className="text-muted-foreground">
                Let's get to know you better so we can personalize your experience
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Alex"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={handleNameBlur}
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
                  onBlur={handleCollegeBlur}
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
                  onBlur={handleDegreeBlur}
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
                  onBlur={handleSemesterBlur}
                  required
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full shadow-card transition-all duration-300 hover:shadow-hover"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Continue'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
