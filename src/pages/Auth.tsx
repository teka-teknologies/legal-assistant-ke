import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scale, Mail, Lock, User, ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const isMobile = useIsMobile();

  // Demo credentials with valid email addresses
  const demoAccounts = [
    {
      name: "Legal Researcher",
      email: "researcher@legalassistant.com",
      password: "demo123456",
      role: "Legal Research Specialist",
    },
    {
      name: "Law Student",
      email: "student@legalassistant.com", 
      password: "demo123456",
      role: "Law Student",
    },
    {
      name: "Legal Consultant",
      email: "consultant@legalassistant.com",
      password: "demo123456", 
      role: "Legal Consultant",
    }
  ];

  // Redirect if already logged in
  if (user) {
    navigate('/documents');
    return null;
  }

  const handleDemoSelect = (demoEmail: string) => {
    const selectedDemo = demoAccounts.find(account => account.email === demoEmail);
    if (selectedDemo) {
      setEmail(selectedDemo.email);
      setPassword(selectedDemo.password);
      setIsSignUp(false); // Switch to sign in mode
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast({
          title: isSignUp ? "Sign up failed" : "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignUp ? "Account created!" : "Welcome back!",
          description: isSignUp 
            ? "Your account has been created successfully."
            : "You have been signed in successfully.",
        });
        
        // Add a slight delay for smooth transition
        setTimeout(() => {
          if (!isSignUp) {
            navigate('/documents');
          }
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-100 to-white rounded-2xl shadow-lg border border-slate-200/50 animate-kenya-bounce">
            <Scale className="h-8 w-8 text-slate-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              LegalAssistant
            </h1>
            <p className="text-slate-600 mt-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl transition-all duration-300 hover:shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 bg-white/90 border-slate-300 focus:border-slate-500 focus:ring-slate-500/20 transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 bg-white/90 border-slate-300 focus:border-slate-500 focus:ring-slate-500/20 transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 shadow-lg transition-all duration-300 hover:scale-105 disabled:scale-100"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  {isSignUp ? (
                    <User className="h-4 w-4 mr-2" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1 text-slate-800 hover:text-slate-600 font-medium transition-colors duration-200"
                disabled={loading}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Demo Account Dropdown */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Try Demo Account</label>
              <Select onValueChange={handleDemoSelect}>
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors">
                  <SelectValue placeholder="Select a demo account" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg">
                  {demoAccounts.map((account, index) => (
                    <SelectItem 
                      key={index} 
                      value={account.email}
                      className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100 px-3 py-2 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{account.name}</span>
                        <span className="text-xs text-slate-500">{account.role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Public Access Link */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200"
          >
            Continue to Civic Education
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
