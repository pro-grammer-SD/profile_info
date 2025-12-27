
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, AlertCircle, Info, Coffee, Clock, Zap } from 'lucide-react';
import { GitHubRepo } from '../types';
import { fetchRepoParticipation } from '../services/githubService';

interface RepoStatsModalProps {
  repo: GitHubRepo;
  onClose: () => void;
}

const RepoStatsModal: React.FC<RepoStatsModalProps> = ({ repo, onClose }) => {
  const [data, setData] = useState<{ all: number[], owner: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loadStats = async () => {
      setLoading(true);
      try {
        const stats = await fetchRepoParticipation(repo.name);
        
        if (!mounted) return;

        // If stats are null (GitHub returning 202 while calculating), retry a few times
        if (!stats && retryCount < 3) {
            timeoutId = setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, 2000); // Wait 2s before retrying
            return;
        }

        setData(stats);
        setLoading(false);
      } catch (e) {
        if (mounted) setLoading(false);
      }
    };

    loadStats();

    return () => { 
        mounted = false;
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [repo.name, retryCount]);

  const { maxCommit, totalCommits, hasActivity, activityArray } = useMemo(() => {
    // Ensure we have a valid array of 52 weeks
    const allStats = data?.all && Array.isArray(data.all) ? data.all : [];
    
    // If empty or null, return defaults
    if (allStats.length === 0) return { maxCommit: 1, totalCommits: 0, hasActivity: false, activityArray: [] };

    const total = allStats.reduce((a, b) => a + b, 0);
    return {
      maxCommit: Math.max(...allStats, 1),
      totalCommits: total,
      hasActivity: total > 0,
      activityArray: allStats
    };
  }, [data]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-coffee-950/90 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-[95%] sm:max-w-2xl bg-white dark:bg-coffee-900 rounded-[1.5rem] sm:rounded-[3rem] shadow-[0_35px_100px_-15px_rgba(0,0,0,0.6)] overflow-hidden border border-coffee-200/50 dark:border-coffee-700/50 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-coffee-300 via-coffee-600 to-coffee-800 z-10" />
        
        <div className="overflow-y-auto overflow-x-hidden custom-scrollbar p-5 sm:p-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6 sm:mb-8 shrink-0">
                <div className="pr-4">
                    <div className="flex items-center gap-2 text-coffee-500 dark:text-coffee-400 mb-1 sm:mb-2">
                        <Activity size={14} className="animate-pulse sm:w-4 sm:h-4" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Codebase Chemistry</span>
                    </div>
                    <h3 className="text-xl sm:text-4xl font-display font-black text-coffee-950 dark:text-coffee-50 tracking-tighter break-words leading-tight">
                      {repo.name}
                    </h3>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 sm:p-3 rounded-full bg-coffee-50 dark:bg-coffee-800/50 text-coffee-400 hover:text-coffee-950 dark:hover:text-white transition-all active:scale-75 flex-shrink-0"
                >
                    <X size={18} className="sm:w-5 sm:h-5" />
                </button>
            </div>

            <div className="min-h-[220px] sm:min-h-[300px] flex flex-col bg-coffee-50/50 dark:bg-black/30 rounded-2xl sm:rounded-[2.5rem] border border-coffee-100 dark:border-coffee-800/50 p-4 sm:p-10 relative shrink-0">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-5">
                        <div className="relative">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 border-4 border-coffee-100 dark:border-coffee-800 border-t-coffee-700 rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Coffee size={12} className="text-coffee-700 dark:text-coffee-400 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-coffee-400 uppercase tracking-[0.4em] animate-pulse">Running Lab Tests...</span>
                            {retryCount > 0 && <span className="text-[8px] text-coffee-300">Calibrating... ({retryCount}/3)</span>}
                        </div>
                    </div>
                ) : hasActivity ? (
                    <div className="w-full h-full flex flex-col justify-end">
                        {/* Bar Graph Container with Fixed Height to prevent collapse */}
                        <div className="w-full h-[120px] sm:h-48 flex items-end justify-between gap-[2px] sm:gap-[3px] pt-2 shrink-0">
                            {activityArray.map((count, i) => {
                                const heightPercent = maxCommit > 0 ? (count / maxCommit) * 100 : 0;
                                const visualHeight = count > 0 ? Math.max(heightPercent, 8) : 4;
                                
                                return (
                                    <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                                        <div className="w-full h-full flex flex-col justify-end">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${visualHeight}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.015 }}
                                                className={`w-full rounded-[1px] sm:rounded-[2px] transition-all duration-300 relative ${
                                                count > 0 
                                                ? 'bg-gradient-to-t from-coffee-800 via-coffee-600 to-coffee-400 dark:from-coffee-500 dark:via-coffee-400 dark:to-coffee-200' 
                                                : 'bg-coffee-200/50 dark:bg-coffee-800/30'
                                                }`}
                                            >
                                                {count > 0 && (
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1px] sm:rounded-[2px]" />
                                                )}
                                            </motion.div>
                                        </div>
                                        
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 sm:mb-4 px-2 sm:px-3 py-1 sm:py-2 bg-coffee-950 text-white text-[9px] sm:text-[10px] rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 font-black shadow-xl transition-all translate-y-2 group-hover:translate-y-0 border border-coffee-800 flex items-center gap-1.5 hidden sm:flex">
                                            <div className="w-1.5 h-1.5 rounded-full bg-coffee-400" />
                                            <span className="text-coffee-300">WK {52 - i}:</span>
                                            {count} {count === 1 ? 'commit' : 'commits'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 sm:mt-8 flex justify-between items-center text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-coffee-400/80 pt-3 sm:pt-6 border-t border-coffee-200/50 dark:border-coffee-800/50 shrink-0">
                            <span className="flex items-center gap-1 sm:gap-2"><Clock size={10} /> 1 YR AGO</span>
                            <div className="flex items-center gap-2 sm:gap-4 hidden xs:flex">
                               <div className="flex items-center gap-1 sm:gap-2">
                                 <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-coffee-500" />
                                 <span>ACTIVITY</span>
                               </div>
                            </div>
                            <span>TODAY</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-10">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-coffee-100/50 dark:bg-coffee-800/30 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                          <AlertCircle size={24} className="text-coffee-300 dark:text-coffee-600 sm:w-8 sm:h-8" />
                        </div>
                        <h4 className="text-coffee-950 dark:text-coffee-100 font-display font-black text-lg sm:text-xl mb-2">Cold Brew Detected</h4>
                        <p className="text-coffee-500 dark:text-coffee-400 text-xs max-w-[220px] leading-relaxed italic font-serif">
                            {data ? "No recent batches found in the last year. The server is quiet, but the code still tastes great." : "GitHub's barista is still processing your request. Try again in a minute."}
                        </p>
                        <button onClick={onClose} className="mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 bg-coffee-800 dark:bg-coffee-100 text-white dark:text-coffee-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all">
                          Noted
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 sm:mt-10 grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-5 shrink-0">
                 <div className="p-4 sm:p-6 bg-coffee-50 dark:bg-coffee-900/40 rounded-2xl sm:rounded-[2rem] border border-coffee-100 dark:border-coffee-800/50 flex flex-col gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-coffee-800 rounded-lg sm:rounded-xl shadow-md flex items-center justify-center text-coffee-600 dark:text-coffee-300">
                        <Activity size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-coffee-400 mb-1">Total Batches</div>
                        <div className="text-2xl sm:text-3xl font-black text-coffee-950 dark:text-white leading-none">
                            {loading ? '...' : totalCommits}
                        </div>
                    </div>
                 </div>
                 <div className="p-4 sm:p-6 bg-coffee-50 dark:bg-coffee-900/40 rounded-2xl sm:rounded-[2rem] border border-coffee-100 dark:border-coffee-800/50 flex flex-col gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-coffee-800 rounded-lg sm:rounded-xl shadow-md flex items-center justify-center text-coffee-600 dark:text-coffee-300">
                        <Zap size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-coffee-400 mb-1">Weekly Intensity</div>
                        <div className="text-2xl sm:text-3xl font-black text-coffee-950 dark:text-white leading-none">
                            {loading ? '...' : (totalCommits / 52).toFixed(1)}
                        </div>
                    </div>
                 </div>
            </div>
            
            <div className="mt-6 sm:mt-8 px-4 sm:px-5 py-3 sm:py-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex items-start gap-3 shrink-0">
              <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-800/70 dark:text-blue-300/70 font-medium leading-relaxed italic">
                These metrics represent all commit activity synchronized with the main repository across the past 52-week roasting cycle.
              </p>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RepoStatsModal;
