/**
 * LogoPreloader Component
 * Invisible component that preloads logos in the background
 * for optimal performance across the application
 */

import React, { useEffect, useState } from 'react';
import { LOGO_CONFIGS, logoCache } from '../../utils/logoCache';

interface LogoPreloaderProps {
  onPreloadComplete?: () => void;
  showDebugInfo?: boolean;
}

const LogoPreloader: React.FC<LogoPreloaderProps> = ({ 
  onPreloadComplete, 
  showDebugInfo = false 
}) => {
  const [preloadStatus, setPreloadStatus] = useState<{
    completed: number;
    total: number;
    errors: string[];
  }>({
    completed: 0,
    total: 0,
    errors: []
  });

  useEffect(() => {
    const preloadLogos = async () => {
      const logoConfigs = Object.values(LOGO_CONFIGS).filter(config => config.preload);
      setPreloadStatus(prev => ({ ...prev, total: logoConfigs.length }));

      const results = await Promise.allSettled(
        logoConfigs.map(async (config) => {
          try {
            await logoCache.preloadLogo(config);
            setPreloadStatus(prev => ({ 
              ...prev, 
              completed: prev.completed + 1 
            }));
            return { success: true, config };
          } catch (error) {
            const errorMessage = `Failed to preload ${config.src}: ${error}`;
            setPreloadStatus(prev => ({ 
              ...prev, 
              completed: prev.completed + 1,
              errors: [...prev.errors, errorMessage]
            }));
            return { success: false, config, error };
          }
        })
      );

      // Log results in development
      if (process.env.NODE_ENV === 'development') {
        const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
        const failed = results.length - successful;
        
        console.log(`🖼️ Logo preloading completed: ${successful}/${results.length} successful`);
        if (failed > 0) {
          console.warn(`⚠️ ${failed} logos failed to preload`);
        }
      }

      // Notify completion
      onPreloadComplete?.();
    };

    preloadLogos();
  }, [onPreloadComplete]);

  // Don't render anything in production
  if (process.env.NODE_ENV !== 'development' || !showDebugInfo) {
    return null;
  }

  // Development debug UI
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <span>Logo Preloader</span>
      </div>
      
      <div className="space-y-1">
        <div>Progress: {preloadStatus.completed}/{preloadStatus.total}</div>
        
        {preloadStatus.total > 0 && (
          <div className="w-32 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-400 transition-all duration-300"
              style={{ 
                width: `${(preloadStatus.completed / preloadStatus.total) * 100}%` 
              }}
            />
          </div>
        )}
        
        {preloadStatus.errors.length > 0 && (
          <div className="text-red-400 text-xs">
            {preloadStatus.errors.length} errors
          </div>
        )}
        
        <div className="text-gray-400">
          Cache: {logoCache.getCacheStats().cachedLogos} logos
        </div>
      </div>
    </div>
  );
};

export default LogoPreloader;
