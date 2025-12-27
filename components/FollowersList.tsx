
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitHubUser } from '../types';
import { Users, ArrowUpRight, ChevronLeft, ChevronRight, Coffee } from 'lucide-react';

interface FollowersListProps {
  followers: GitHubUser[];
}

const FOLLOWERS_PER_PAGE = 12;

const getFollowerStatus = (id: number) => {
  const statuses = [
    'Espresso Elite',
    'Daily Regular',
    'Caffeine Connoisseur',
    'New Brew Reviewer'
  ];
  return statuses[id % statuses.length];
};

const FollowersList: React.FC<FollowersListProps> = ({ followers }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedFollowers = useMemo(() => {
    return [...followers];
  }, [followers]);

  const totalPages = Math.ceil(sortedFollowers.length / FOLLOWERS_PER_PAGE);
  const currentFollowers = sortedFollowers.slice((currentPage - 1) * FOLLOWERS_PER_PAGE, currentPage * FOLLOWERS_PER_PAGE);

  return (
    <section id="followers" className="py-16 md:py-24 bg-white dark:bg-coffee-950 rounded-t-[3rem] md:rounded-t-[5rem] shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.1)] min-h-screen relative z-10 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-coffee-100 dark:bg-coffee-900 text-coffee-700 dark:text-coffee-300 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tighter mb-4">
              <Users size={14} />
              <span>Patron Registry</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-display font-black text-coffee-950 dark:text-coffee-50 tracking-tight leading-none mb-4">
                The Roast Testers
            </h2>
            <p className="text-coffee-500 dark:text-coffee-400 text-base sm:text-lg font-serif italic">The regular patrons who savor every update in the cellar.</p>
        </div>

        {sortedFollowers.length > 0 ? (
             <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                        {currentFollowers.map((follower, index) => (
                            <motion.div
                                key={follower.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: (index % 4) * 0.05 }}
                                className="bg-coffee-50 dark:bg-coffee-900/20 rounded-[2rem] p-6 md:p-8 border border-coffee-100 dark:border-coffee-800 hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col"
                            >
                                <div className="flex items-center gap-4 md:gap-6 mb-6">
                                     <div className="relative flex-shrink-0">
                                        <div className="absolute inset-0 bg-coffee-500/20 rounded-full blur-xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img 
                                            src={follower.avatar_url} 
                                            alt={follower.login}
                                            className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 md:border-4 border-white dark:border-coffee-800 shadow-lg object-cover relative z-10" 
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-coffee-800 dark:bg-coffee-100 rounded-full p-1 shadow-md z-20">
                                            <Coffee size={10} className="text-white dark:text-coffee-900" />
                                        </div>
                                     </div>
                                     <div className="min-w-0">
                                         <div className="text-[10px] font-black text-coffee-400 uppercase tracking-widest mb-0.5">
                                            Order #{follower.id.toString().slice(-4)}
                                         </div>
                                         <div className="text-[9px] font-black text-coffee-600 dark:text-coffee-300 uppercase tracking-[0.2em] leading-none mb-2">
                                            {getFollowerStatus(follower.id)}
                                         </div>
                                         <h3 className="font-display font-bold text-lg text-coffee-900 dark:text-coffee-100 truncate group-hover:text-coffee-700 dark:group-hover:text-coffee-200 transition-colors">
                                             {follower.name || follower.login}
                                         </h3>
                                     </div>
                                </div>
                                
                                <div className="flex-1">
                                    <p className="text-coffee-500 dark:text-coffee-400 text-xs mb-4 font-mono">@{follower.login}</p>
                                    <p className="text-coffee-600 dark:text-coffee-300 text-[11px] md:text-xs line-clamp-2 italic leading-relaxed">
                                        {follower.bio || "Savoring the bits, one byte at a time with a warm cup."}
                                    </p>
                                </div>
                                
                                <div className="mt-8 flex justify-end">
                                    <a 
                                        href={follower.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[9px] font-black tracking-widest uppercase text-coffee-600 dark:text-coffee-300 hover:text-white hover:bg-coffee-800 dark:hover:bg-coffee-100 dark:hover:text-coffee-950 px-4 py-2 rounded-xl transition-all border border-coffee-200 dark:border-coffee-700 active:scale-95"
                                    >
                                        <span>PROFILE</span>
                                        <ArrowUpRight size={12} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-5 sm:gap-8 mt-16 md:mt-24">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                            className="p-3 sm:p-4 bg-coffee-100 dark:bg-coffee-900 text-coffee-800 dark:text-coffee-200 rounded-full disabled:opacity-20 hover:scale-110 active:scale-90 transition-all shadow-lg"
                        >
                            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                        </button>
                        <div className="text-center font-display min-w-[100px]">
                            <div className="text-2xl sm:text-3xl font-black text-coffee-900 dark:text-coffee-50 leading-none">{currentPage}</div>
                            <div className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-coffee-400 mt-1">OF {totalPages} PAGES</div>
                        </div>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                            className="p-3 sm:p-4 bg-coffee-100 dark:bg-coffee-900 text-coffee-800 dark:text-coffee-200 rounded-full disabled:opacity-20 hover:scale-110 active:scale-90 transition-all shadow-lg"
                        >
                            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                        </button>
                    </div>
                )}
             </>
        ) : (
            <div className="text-center py-32 md:py-48">
                <p className="text-xl sm:text-2xl font-display font-black text-coffee-300 uppercase tracking-[0.3em] px-4">The club awaits its first member.</p>
            </div>
        )}
      </div>
    </section>
  );
};

export default FollowersList;
