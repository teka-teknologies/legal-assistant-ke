
import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, GitCompare, Scale, GraduationCap, Menu, X, LogOut, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/documents') {
      return location.pathname === '/documents';
    }
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  const navigationItems = [
    { path: '/', icon: GraduationCap, label: 'Civic Education' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/compare', icon: GitCompare, label: 'Compare' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-white kenya-pattern">
      {/* Header with Kenyan flair */}
      <header className="kenya-glass-card border-b shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <div className="flex items-center space-x-1">
                  <Scale className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 transition-transform group-hover:scale-110" />
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 -ml-1" />
                </div>
                <div className="absolute inset-0 bg-green-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold kenyan-gradient-text">
                  LegalAssistant KE
                </h1>
                <p className="text-xs sm:text-sm text-black hidden sm:block font-medium">
                  Msaidizi wa Kisheria 🇰🇪
                </p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-2">
                {navigationItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                      isActive(path)
                        ? "bg-green-600 text-white shadow-lg"
                        : "text-black hover:text-white hover:bg-green-600"
                    )}
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
              </nav>
              
              {user && (
                <div className="flex items-center space-x-2 border-l border-black/20 pl-4">
                  <div className="flex items-center space-x-2 text-sm text-black">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="hidden lg:inline text-green-700 font-medium">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="hover:bg-red-50 hover:border-red-600 hover:text-red-600 border-black/20"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-green-50 transition-colors border border-black/20"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-red-600" />
              ) : (
                <Menu className="h-6 w-6 text-green-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-black/20 pt-4 animate-kenya-fade-in">
              <div className="space-y-2">
                {navigationItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full",
                      isActive(path)
                        ? "bg-green-600 text-white shadow-lg"
                        : "text-black hover:text-white hover:bg-green-600"
                    )}
                  >
                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
                
                {user && (
                  <div className="border-t border-black/20 pt-4 mt-4">
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center space-x-2 text-sm text-black">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">{user.email}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="hover:bg-red-50 hover:border-red-600 hover:text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Status indicator with Kenyan spirit */}
      {user ? (
        <div className="bg-white border-b border-black/10 harambee-spirit">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs sm:text-sm text-green-700">
                <span className="font-medium">Logged in successfully:</span> 
                <span className="hidden sm:inline"> {user.email}</span>
                <span className="sm:hidden"> Welcome!</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs sm:text-sm text-green-700">
                  <span className="font-medium">Public Access:</span> 
                  <span className="hidden sm:inline"> Civic Education Available</span>
                  <span className="sm:hidden"> Limited Access</span>
                </p>
              </div>
              <Link
                to="/auth"
                className="text-xs sm:text-sm text-green-700 hover:text-green-800 font-medium"
              >
                Sign In →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 animate-kenya-fade-in">
        {children}
      </main>
    </div>
  );
};
