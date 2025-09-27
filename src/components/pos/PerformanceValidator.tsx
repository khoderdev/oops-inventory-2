import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface PerformanceValidatorProps {
  componentName: string;
  renderCount: number;
  maxAllowedRenders?: number;
  showAlerts?: boolean;
}

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  performanceScore: 'excellent' | 'good' | 'warning' | 'critical';
  alerts: string[];
}

export const PerformanceValidator: React.FC<PerformanceValidatorProps> = ({
  componentName,
  renderCount,
  maxAllowedRenders = 10,
  showAlerts = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    performanceScore: 'excellent',
    alerts: []
  });
  
  const startTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;
    
    // Track render times
    renderTimes.current.push(timeSinceLastRender);
    if (renderTimes.current.length > 20) {
      renderTimes.current = renderTimes.current.slice(-20); // Keep last 20 renders
    }
    
    // Calculate metrics
    const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    const alerts: string[] = [];
    
    // Performance scoring
    let performanceScore: PerformanceMetrics['performanceScore'] = 'excellent';
    
    if (renderCount > maxAllowedRenders * 2) {
      performanceScore = 'critical';
      alerts.push(`Critical: ${renderCount} renders (expected ≤${maxAllowedRenders})`);
    } else if (renderCount > maxAllowedRenders) {
      performanceScore = 'warning';
      alerts.push(`Warning: ${renderCount} renders (expected ≤${maxAllowedRenders})`);
    } else if (renderCount > maxAllowedRenders * 0.7) {
      performanceScore = 'good';
    }
    
    if (timeSinceLastRender < 16) {
      alerts.push(`Rapid re-render: ${timeSinceLastRender}ms (< 16ms frame time)`);
    }
    
    if (averageRenderTime > 50) {
      alerts.push(`Slow renders: ${averageRenderTime.toFixed(1)}ms average`);
    }
    
    setMetrics({
      renderCount,
      averageRenderTime,
      lastRenderTime: timeSinceLastRender,
      performanceScore,
      alerts
    });
  }, [renderCount, maxAllowedRenders]);

  if (!showAlerts || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getScoreColor = () => {
    switch (metrics.performanceScore) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreIcon = () => {
    switch (metrics.performanceScore) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* Performance Score Card */}
      <div className={`mb-2 p-3 rounded-lg border bg-white shadow-sm ${getScoreColor()}`}>
        <div className="flex items-center gap-2 mb-2">
          {getScoreIcon()}
          <span className="font-semibold text-sm">
            {componentName} Performance: {metrics.performanceScore.toUpperCase()}
          </span>
        </div>
        
        <div className="text-xs space-y-1">
          <div>Renders: {metrics.renderCount}/{maxAllowedRenders}</div>
          <div>Avg Time: {metrics.averageRenderTime.toFixed(1)}ms</div>
          <div>Last: {metrics.lastRenderTime}ms ago</div>
        </div>
      </div>

      {/* Performance Alerts */}
      {metrics.alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-1">Performance Issues:</div>
            <ul className="text-xs space-y-1">
              {metrics.alerts.map((alert, index) => (
                <li key={index}>• {alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Performance monitoring hook for easy integration
export const usePerformanceMonitor = (componentName: string, maxAllowedRenders = 10) => {
  const renderCount = useRef(0);
  const [currentRenderCount, setCurrentRenderCount] = useState(0);
  
  renderCount.current += 1;
  
  useEffect(() => {
    setCurrentRenderCount(renderCount.current);
  });
  
  return {
    renderCount: currentRenderCount,
    PerformanceValidator: () => (
      <PerformanceValidator
        componentName={componentName}
        renderCount={currentRenderCount}
        maxAllowedRenders={maxAllowedRenders}
      />
    )
  };
};

export default PerformanceValidator;
