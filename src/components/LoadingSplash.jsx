import { useState, useEffect } from 'react';
import Logo from './Logo';

function LoadingSplash() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center z-50">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-pulse">
          <Logo className="w-24 h-24 mx-auto opacity-80" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Agent Pass UP Tracker
        </h1>

        {/* Loading Status */}
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
          Preparing your dashboard...
        </p>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading Dots */}
        <div className="flex gap-2 justify-center mt-8">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

export default LoadingSplash;
