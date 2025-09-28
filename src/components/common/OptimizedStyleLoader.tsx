import React, { useEffect, useState } from 'react';

interface StyleProps {
  href: string;
  id?: string;
  media?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Component to optimize CSS loading by loading non-critical styles asynchronously
 */
export const OptimizedStyleLoader: React.FC<StyleProps> = ({
  href,
  id,
  media = 'all',
  onLoad,
  onError
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if the stylesheet is already loaded
    const existingLink = document.getElementById(id || `style-${href}`);
    if (existingLink) {
      setLoaded(true);
      onLoad?.();
      return;
    }

    // Create a new link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print'; // Initially set to print to avoid blocking render
    link.id = id || `style-${href}`;
    
    // Set onload handler
    link.onload = () => {
      // Switch to the target media once loaded
      link.media = media;
      setLoaded(true);
      onLoad?.();
    };
    
    // Set onerror handler
    link.onerror = (e) => {
      console.error(`Failed to load stylesheet: ${href}`, e);
      if (onError) onError(new Error(`Failed to load stylesheet: ${href}`));
    };
    
    // Append to document head
    document.head.appendChild(link);
    
    // Cleanup function
    return () => {
      // Only remove if it's not needed elsewhere
      if (id) {
        const linkElement = document.getElementById(id);
        if (linkElement) {
          document.head.removeChild(linkElement);
        }
      }
    };
  }, [href, id, media, onLoad, onError]);

  return null;
};

/**
 * Preload a stylesheet without applying it immediately
 * 
 * This function ensures the stylesheet is used shortly after preloading
 * to avoid browser console warnings about unused preloaded resources
 */
export const preloadStylesheet = (href: string): void => {
  // Check if already preloaded
  const existingLink = document.querySelector(`link[rel="preload"][href="${href}"]`);
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = () => {
    // Apply the stylesheet shortly after preloading to avoid warnings
    // This creates a non-blocking stylesheet load pattern
    setTimeout(() => {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = href;
      styleLink.media = 'print';
      styleLink.onload = () => {
        styleLink.media = 'all';
      };
      document.head.appendChild(styleLink);
    }, 100); // Short timeout to ensure the preload is used
  };
  
  document.head.appendChild(link);
};

/**
 * Prefetch a stylesheet for future use
 */
export const prefetchStylesheet = (href: string): void => {
  // Check if already prefetched
  const existingLink = document.querySelector(`link[rel="prefetch"][href="${href}"]`);
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'style';
  link.href = href;
  
  document.head.appendChild(link);
};
