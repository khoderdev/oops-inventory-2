import React, { useEffect, useRef } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  enabled?: boolean;
  maxRenders?: number;
  onExcessiveRenders?: (count: number) => void;
}

/**
 * A component that monitors render performance and logs when a component renders too many times.
 * Only used in development mode and when enabled.
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  enabled = true,
  maxRenders = 20,
  onExcessiveRenders
}) => {
  const renderCount = useRef(0);
  const lastLogTime = useRef(Date.now());
  const logInterval = 5000; // Only log once every 5 seconds

  useEffect(() => {
    if (!enabled) return;
    
    renderCount.current += 1;
    
    // Only log if we've exceeded maxRenders and enough time has passed since last log
    const now = Date.now();
    if (renderCount.current > maxRenders && now - lastLogTime.current > logInterval) {
      console.warn(`⚠️ Performance Warning: ${componentName} has rendered ${renderCount.current} times`);
      lastLogTime.current = now;
      
      if (onExcessiveRenders) {
        onExcessiveRenders(renderCount.current);
      }
    }
    
    return () => {
      // Reset counter when component unmounts
      renderCount.current = 0;
    };
  });

  // This component doesn't render anything
  return null;
};

/**
 * A higher-order component that wraps a component with performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<PerformanceMonitorProps, 'componentName'> = {}
): React.FC<P> {
  const componentName = Component.displayName || Component.name || 'UnnamedComponent';
  
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <>
        <PerformanceMonitor componentName={componentName} {...options} />
        <Component {...props} />
      </>
    );
  };
  
  WrappedComponent.displayName = `WithPerformanceMonitoring(${componentName})`;
  
  return WrappedComponent;
}
