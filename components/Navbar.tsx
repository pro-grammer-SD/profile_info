import React, { useState } from 'react';
import { Coffee, Github, Home, Package, Sun, Moon, Users, Menu, X, RefreshCw } from 'lucide-react';
import { GitHubUser } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  user: GitHubUser | null;
  isDark: boolean;
  toggleTheme: () => void;
  currentView: 'home' | 'followers';
  setView: (view: 'home' | 'followers') => void;
  onRefresh: () => void;
  isUsingCache?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, isDark, toggleTheme, currentView, setView, onRefresh, isUsingCache }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000); // Min animation time
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu if open
    if (currentView !== 'home') {
        setView('home');
        // Allow render to happen then scroll
        setTimeout(() => {
             const element = document.getElementById(id);
             if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSetView = (view: 'home' | 'followers') => {
      setView(view);
      setIsMobileMenuOpen(false);
  };

  const navLinks = [
      { id: 'hero', label: 'Home', icon: Home, action: () => scrollToSection('hero'), active: currentView === 'home' },
      { id: 'followers', label: 'People', icon: Users, action: () => handleSetView('followers'), active: currentView === 'followers' },
      { id: 'repos', label: 'Repos', icon: Package, action: () => scrollToSection('repos'), active: false },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-coffee-50/90 dark:bg-coffee-950/90 backdrop-blur-md border-b border-coffee-200 dark:border-coffee-800 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand / Profile */}
          <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => scrollToSection('hero')}>
            <div className="relative">
                {user ? (
                    <img className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-coffee-600 dark:border-coffee-400 group-hover:scale-105 transition-transform" src={user.avatar_url} alt={user.login} />
                ) : (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-coffee-300 animate-pulse flex items-center justify-center">
                       <Coffee size={16} className="text-coffee-100" />
                    </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-coffee-800 rounded-full p-0.5">
                    <Coffee size={10} className="text-coffee-700 dark:text-coffee-300 sm:w-3 sm:h-3" />
                </div>
            </div>
            <span className="ml-2 sm:ml-3 font-display font-bold text-base sm:text-lg text-coffee-800 dark:text-coffee-100 block">
              {user?.login || '...'}
            </span>
          </div>

          {/* Desktop Controls & Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex space-x-2">
                {navLinks.map((link) => (
                    <button 
                        key={link.label}
                        onClick={link.action}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${link.active ? 'text-coffee-900 dark:text-white bg-coffee-100 dark:bg-coffee-800' : 'text-coffee-600 dark:text-coffee-300 hover:text-coffee-900 dark:hover:text-white hover:bg-coffee-100 dark:hover:bg-coffee-800'}`}
                    >
                    <link.icon size={18} />
                    <span>{link.label}</span>
                    </button>
                ))}
            </div>
            
            {/* Reload Button */}
            <button
                onClick={handleRefresh}
                className="p-2 rounded-full text-coffee-600 dark:text-coffee-300 hover:bg-coffee-100 dark:hover:bg-coffee-800 transition-colors relative"
                title="Refill Coffee (Reload Data)"
            >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                {isUsingCache && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Using cached data"></span>
                )}
            </button>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-coffee-600 dark:text-coffee-300 hover:bg-coffee-100 dark:hover:bg-coffee-800 transition-colors relative overflow-hidden"
                title="Toggle Roast"
            >
                <motion.div
                    initial={false}
                    animate={{ rotate: isDark ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
            </button>

             <a 
                href={`https://github.com/${user?.login || 'pro-grammer-SD'}`}
                target="_blank" 
                rel="noreferrer"
                className="text-coffee-600 dark:text-coffee-300 hover:text-coffee-900 dark:hover:text-white px-2 sm:px-3 py-2 rounded-md transition-colors hover:bg-coffee-100 dark:hover:bg-coffee-800 flex items-center gap-2"
            >
              <Github size={20} />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-coffee-600 dark:text-coffee-300 hover:bg-coffee-100 dark:hover:bg-coffee-800 rounded-md transition-colors"
                aria-label="Toggle Menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-coffee-50/95 dark:bg-coffee-950/95 backdrop-blur-xl border-t border-coffee-200 dark:border-coffee-800 overflow-hidden"
            >
                <div className="px-4 pt-2 pb-6 space-y-2 shadow-inner">
                    {navLinks.map((link) => (
                        <button
                            key={link.label}
                            onClick={link.action}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                                link.active 
                                ? 'bg-coffee-100 dark:bg-coffee-800 text-coffee-900 dark:text-coffee-100' 
                                : 'text-coffee-600 dark:text-coffee-400 hover:bg-coffee-100/50 dark:hover:bg-coffee-800/50'
                            }`}
                        >
                            <link.icon size={20} />
                            {link.label}
                        </button>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;