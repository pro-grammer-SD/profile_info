import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PeriodicRefreshProps {
  onRefresh: () => void;
}

const PeriodicRefresh: React.FC<PeriodicRefreshProps> = ({ onRefresh }) => {
  const [stage, setStage] = useState<'idle' | 'dropping' | 'splashing'>('idle');

  useEffect(() => {
    const interval = setInterval(() => {
      if (stage === 'idle') {
        setStage('dropping');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [stage]);

  const handleDropComplete = () => {
    setStage('splashing');
    onRefresh(); // Trigger data refresh at impact
  };

  const handleSplashComplete = () => {
    setStage('idle');
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* The Falling Drop */}
        {stage === 'dropping' && (
          <motion.div
            key="drop"
            initial={{ y: -50, opacity: 0 }}
            animate={{ 
              y: '50vh', 
              opacity: 1,
              transition: { 
                duration: 0.8, 
                ease: "easeIn" 
              } 
            }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            onAnimationComplete={handleDropComplete}
            className="absolute top-0"
          >
            {/* Drop Shape */}
            <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C12 0 0 20 0 26C0 31.5228 5.37258 36 12 36C18.6274 36 24 31.5228 24 26C24 20 12 0 12 0Z" fill="#6f453b"/>
            </svg>
          </motion.div>
        )}

        {/* The Circular Fluid Splash */}
        {stage === 'splashing' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            {/* Main expanding ripple */}
            <motion.div
              key="splash-main"
              initial={{ scale: 0, opacity: 0.8, rotate: 0 }}
              animate={{ 
                scale: [0, 4, 20], 
                opacity: [0.8, 0.5, 0],
                rotate: 180,
                transition: { duration: 1.2, ease: "easeOut" } 
              }}
              onAnimationComplete={handleSplashComplete}
              className="w-20 h-20 bg-coffee-600 rounded-full blur-sm absolute"
            />
            
            {/* Swirling liquid effect */}
            <motion.div
              key="splash-swirl"
              initial={{ scale: 0, opacity: 1, rotate: 0 }}
              animate={{ 
                scale: [0, 2, 5], 
                opacity: [1, 0],
                rotate: -90,
                borderRadius: ["40%", "50%", "40%"],
                transition: { duration: 1.0, ease: "easeOut" } 
              }}
              className="w-16 h-16 border-4 border-coffee-800 rounded-full absolute"
            />

             <motion.div
              key="splash-ring"
              initial={{ scale: 0, opacity: 1, borderWidth: "10px" }}
              animate={{ 
                scale: 30, 
                opacity: 0,
                borderWidth: "0px",
                transition: { duration: 1.5, ease: "linear" } 
              }}
              className="w-10 h-10 border-coffee-500 rounded-full absolute box-border"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PeriodicRefresh;
