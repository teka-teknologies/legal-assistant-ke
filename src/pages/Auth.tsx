
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 kenya-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-kenya-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl border-2 border-green-200 animate-kenya-bounce">
            <Scale className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold kenyan-gradient-text">
              LegalAssistant KE
            </h1>
            <p className="text-green-800 mt-2 font-semibold text-lg">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="p-8 bg-white/95 backdrop-filter backdrop-blur-sm shadow-2xl border-2 border-green-300 transition-all duration-300 hover:shadow-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-green-800 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-700" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-12 bg-green-50 border-2 border-green-300 focus:border-green-600 focus:ring-green-600/30 transition-all duration-200 text-green-900 placeholder:text-green-600"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-green-800 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-700" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-12 bg-green-50 border-2 border-green-300 focus:border-green-600 focus:ring-green-600/30 transition-all duration-200 text-green-900 placeholder:text-green-600"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white shadow-xl transition-all duration-300 hover:scale-105 disabled:scale-100 py-3 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  {isSignUp ? (
                    <User className="h-5 w-5 mr-3" />
                  ) : (
                    <LogIn className="h-5 w-5 mr-3" />
                  )}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-base text-green-800">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-red-700 hover:text-red-800 font-semibold transition-colors duration-200 underline"
                disabled={loading}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Demo Account Dropdown */}
          <div className="mt-8 pt-6 border-t-2 border-green-200">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-green-800 uppercase tracking-wide">Try Demo Account</label>
              <Select onValueChange={handleDemoSelect}>
                <SelectTrigger className="w-full bg-green-100 border-2 border-green-400 text-green-800 hover:bg-green-200 transition-colors font-medium">
                  <SelectValue placeholder="Select a demo account" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-green-300 shadow-2xl">
                  {demoAccounts.map((account, index) => (
                    <SelectItem 
                      key={index} 
                      value={account.email}
                      className="cursor-pointer hover:bg-green-100 focus:bg-green-200 px-4 py-3 transition-colors border-b border-green-100 last:border-b-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-900 text-base">{account.name}</span>
                        <span className="text-sm text-green-700 font-medium">{account.role}</span>
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
            className="inline-flex items-center text-base text-green-800 hover:text-red-700 transition-colors duration-200 font-semibold bg-white/80 px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
          >
            Continue to Civic Education
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
