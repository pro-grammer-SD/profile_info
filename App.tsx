import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { fetchProfile, fetchRepos, fetchPinnedRepos, fetchFollowers, RateLimitError } from './services/githubService';
import { GitHubUser, GitHubRepo } from './types';
import CoffeeLoader from './components/CoffeeLoader';
import Navbar from './components/Navbar';
import ProfileHero from './components/ProfileHero';
import RepoGrid from './components/RepoGrid';
import FollowersList from './components/FollowersList';
import PeriodicRefresh from './components/PeriodicRefresh';

const CACHE_KEY = 'coffee_code_cache';

interface CachedData {
  user: GitHubUser;
  repos: GitHubRepo[];
  pinnedRepos: GitHubRepo[];
  followers: GitHubUser[];
  timestamp: number;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [pinnedRepos, setPinnedRepos] = useState<GitHubRepo[]>([]);
  const [followers, setFollowers] = useState<GitHubUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitReset, setRateLimitReset] = useState<number | null>(null);
  
  // Data State
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cacheAvailable, setCacheAvailable] = useState(false);
  
  // UI State
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'followers'>('home');
  const [isDark, setIsDark] = useState(false);

  // Countdown timer for error page
  const [timeLeftStr, setTimeLeftStr] = useState<string>("--:--:--");

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDark(true);
    }
    // Check if cache exists on mount
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) setCacheAvailable(true);
  }, []);

  useEffect(() => {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Timer logic
  useEffect(() => {
    if (!rateLimitReset) return;

    const updateTimer = () => {
        const now = Date.now();
        const resetTimeMs = rateLimitReset * 1000;
        const diff = resetTimeMs - now;

        if (diff <= 0) {
            setTimeLeftStr("Ready to brew!");
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeftStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer(); // Initial call
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [rateLimitReset]);

  const saveToCache = (data: CachedData) => {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setCacheAvailable(true);
  };

  const loadFromCache = () => {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
          try {
              const data: CachedData = JSON.parse(cachedStr);
              setUser(data.user);
              setRepos(data.repos);
              setPinnedRepos(data.pinnedRepos);
              setFollowers(data.followers);
              setUsingCachedData(true);
              setError(null); // Clear blocking error
              return true;
          } catch (e) {
              console.error("Cache parse error", e);
              return false;
          }
      }
      return false;
  };

  const loadData = useCallback(async (isInitial: boolean = false, isManualRefresh: boolean = false) => {
      if (isInitial) setLoading(true);

      const fetchPromise = Promise.all([
          fetchProfile(),
          fetchRepos(),
          fetchPinnedRepos(),
          fetchFollowers()
      ]);

      const minLoadTime = isInitial ? new Promise(resolve => setTimeout(resolve, 3500)) : Promise.resolve();

      try {
          // Wait for minimum load time if initial, otherwise just fetch
          const [results] = await Promise.all([fetchPromise, minLoadTime]);
          const [userData, reposData, pinnedData, followersData] = results;
          
          setUser(userData);
          setRepos(reposData);
          setPinnedRepos(pinnedData);
          setFollowers(followersData);
          setError(null);
          setRateLimitReset(null);
          setUsingCachedData(false);
          setShowRateLimitDialog(false);

          // Save to cache
          saveToCache({
              user: userData,
              repos: reposData,
              pinnedRepos: pinnedData,
              followers: followersData,
              timestamp: Date.now()
          });
          
      } catch (err: any) {
          console.error("Error loading profile:", err);
          
          // Handle Rate Limit specifically
          if (err instanceof RateLimitError || err.resetTime || err.message.includes('Rate Limit')) {
              const resetTime = err.resetTime || (Math.floor(Date.now() / 1000) + 3600);
              setRateLimitReset(resetTime);
              
              if (isManualRefresh) {
                  // If refreshing from main view, don't crash, show dialog
                  setShowRateLimitDialog(true);
              } else {
                  // If initial load or periodic refresh while already in error state
                  setError("Out of Coffee Beans");
              }
          } else {
              if(!isManualRefresh) setError("Network Connection Error");
          }

      } finally {
          if (isInitial) setLoading(false);
      }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleProceedWithCache = () => {
      const success = loadFromCache();
      if (!success) {
          alert("Failed to load cached data. Please wait for the refill.");
      }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && (
            <motion.div 
                key="loader"
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-50 bg-coffee-50 dark:bg-coffee-950"
            >
                <CoffeeLoader />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Main App View */}
      {!loading && !error && user && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col bg-coffee-50 dark:bg-coffee-950 transition-colors duration-500 relative"
        >
          <Navbar 
            user={user} 
            isDark={isDark} 
            toggleTheme={toggleTheme} 
            currentView={currentView}
            setView={setCurrentView}
            onRefresh={() => loadData(false, true)}
            isUsingCache={usingCachedData}
          />
          
          <main className="flex-grow">
            <ProfileHero user={user} setView={setCurrentView} />
            
            <AnimatePresence mode="wait">
                {currentView === 'home' ? (
                    <motion.div 
                        key="home"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <RepoGrid repos={repos} pinnedRepos={pinnedRepos} />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="followers"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FollowersList followers={followers} />
                    </motion.div>
                )}
            </AnimatePresence>
          </main>

          <footer className="bg-white dark:bg-coffee-900 py-8 border-t border-coffee-200 dark:border-coffee-800 mt-auto transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 text-center text-coffee-500 dark:text-coffee-400 text-sm">
              <p>&copy; {new Date().getFullYear()} {user.name || user.login}. Brewed with React & Coffee.</p>
              {usingCachedData && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                      <Clock size={10} /> Serving Cold Brew (Cached Data)
                  </p>
              )}
            </div>
          </footer>

          {/* Rate Limit Modal Dialog for Main View */}
          <AnimatePresence>
             {showRateLimitDialog && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                     <motion.div 
                         initial={{ opacity: 0 }} 
                         animate={{ opacity: 1 }} 
                         exit={{ opacity: 0 }}
                         className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                         onClick={() => setShowRateLimitDialog(false)}
                     />
                     <motion.div
                         initial={{ scale: 0.9, opacity: 0, y: 20 }}
                         animate={{ scale: 1, opacity: 1, y: 0 }}
                         exit={{ scale: 0.9, opacity: 0, y: 20 }}
                         transition={{ type: "spring", stiffness: 300, damping: 30 }}
                         className="bg-white dark:bg-coffee-900 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 max-w-md w-full border border-coffee-200 dark:border-coffee-700"
                     >
                         <h3 className="text-xl font-display font-bold text-coffee-800 dark:text-coffee-100 mb-2">Still Brewing...</h3>
                         <p className="text-coffee-600 dark:text-coffee-300 mb-4">
                             GitHub's coffee machine is still cooling down. We can't fetch fresh data just yet.
                         </p>
                         
                         <div className="bg-coffee-50 dark:bg-coffee-800 rounded-lg p-4 flex items-center justify-between mb-6">
                             <span className="text-coffee-500 dark:text-coffee-400 text-sm font-bold uppercase">Refill In</span>
                             <span className="font-mono text-2xl text-coffee-800 dark:text-coffee-100 font-bold">{timeLeftStr}</span>
                         </div>
                         
                         <button 
                             onClick={() => setShowRateLimitDialog(false)}
                             className="w-full py-3 bg-coffee-600 hover:bg-coffee-700 text-white rounded-xl font-bold transition-colors"
                         >
                             Okay, I'll sip slowly
                         </button>
                     </motion.div>
                 </div>
             )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Blocking Error Screen (Out of Coffee Beans) */}
      {error && !loading && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-coffee-50 dark:bg-coffee-950 text-coffee-900 dark:text-coffee-100 relative overflow-hidden">
            {/* Auto-reload animation strictly for Error State */}
            <PeriodicRefresh onRefresh={() => loadData(false, false)} />
            
            <div className="z-20 flex flex-col items-center max-w-md w-full">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl mb-6 drop-shadow-md"
                >
                    ☕💔
                </motion.div>
                
                <h1 className="text-3xl font-display font-bold mb-3">Out of Coffee Beans</h1>
                <p className="text-coffee-600 dark:text-coffee-300 mb-8 max-w-xs mx-auto leading-relaxed">
                    We've hit the GitHub rate limit. The pot is empty. 
                    Auto-refill triggered every 5s.
                </p>

                {rateLimitReset && (
                    <div className="bg-white dark:bg-coffee-900 border border-coffee-200 dark:border-coffee-700 rounded-xl p-6 w-full shadow-lg mb-8">
                        <p className="text-xs text-coffee-400 dark:text-coffee-500 font-bold uppercase tracking-widest mb-2">Next Brew Batch In</p>
                        <div className="font-mono text-4xl sm:text-5xl font-bold text-coffee-800 dark:text-coffee-100">
                            {timeLeftStr}
                        </div>
                    </div>
                )}

                {cacheAvailable && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleProceedWithCache}
                        className="flex items-center gap-3 px-6 py-3 bg-coffee-600 dark:bg-coffee-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all group w-full justify-center sm:w-auto"
                    >
                        <div className="text-left">
                            <span className="block text-xs text-coffee-200 font-bold uppercase">Emergency Stash</span>
                            <span className="block text-lg font-bold">Proceed with Last Data</span>
                        </div>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                )}
            </div>
        </div>
      )}
    </>
  );
};

export default App;