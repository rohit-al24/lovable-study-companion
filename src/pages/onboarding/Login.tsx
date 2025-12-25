import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Progress } from "@/components/ui/progress";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { email, password } = formData;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      toast({ title: 'Login successful', description: 'Redirecting to dashboard...' });
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      toast({ title: 'Login error', description: 'Could not sign in', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-info/20 p-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto py-8 w-full animate-fade-in">
        <Card className="p-8 shadow-soft w-full max-w-md mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">Login</h2>
            <p className="text-muted-foreground">Sign in to your Lovable account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <div className="pt-6 text-center">
            <span className="text-sm text-muted-foreground">Don't have an account? </span>
            <button
              className="text-primary underline text-sm"
              onClick={() => navigate('/onboarding/profile')}
            >
              Register
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
