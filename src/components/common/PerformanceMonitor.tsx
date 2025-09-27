import React, { useEffect, useRef } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  maxRenders?: number;
  intervalMs?: number;
  onExcessiveRenders?: (renderCount: number) => void;
}

/**
 * A component that monitors render performance and logs warnings for excessive renders
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  maxRenders = 5,
  intervalMs = 1000,
  onExcessiveRenders
}) => {
  const renderCount = useRef(0);
  const lastResetTime = useRef(Date.now());
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  
  // Increment render count on each render
  renderCount.current += 1;
  
  // Setup monitoring interval
  useEffect(() => {
    // Reset counters and check for excessive renders periodically
    intervalId.current = setInterval(() => {
      const now = Date.now();
      const elapsedTime = now - lastResetTime.current;
      
      // Only evaluate if at least intervalMs has passed
      if (elapsedTime >= intervalMs) {
        const rendersPerSecond = (renderCount.current * 1000) / elapsedTime;
        
        // Log warning if renders exceed threshold
        if (renderCount.current > maxRenders) {
          console.warn(
            `⚠️ Performance Warning: ${componentName} rendered ${renderCount.current} times in ${elapsedTime}ms (${rendersPerSecond.toFixed(2)}/sec)`
          );
          
          // Call callback if provided
          if (onExcessiveRenders) {
            onExcessiveRenders(renderCount.current);
          }
        }
        
        // Reset counters
        renderCount.current = 0;
        lastResetTime.current = now;
      }
    }, intervalMs);
    
    // Cleanup interval on unmount
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [componentName, maxRenders, intervalMs, onExcessiveRenders]);
  
  // This component doesn't render anything
  return null;
};
