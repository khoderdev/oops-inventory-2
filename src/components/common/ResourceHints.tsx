import React, { useEffect } from 'react';

interface ResourceHintsProps {
  preconnect?: string[];
  prefetch?: string[];
  preload?: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font' | 'fetch';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
  prerender?: string[];
  dnsPrefetch?: string[];
}

/**
 * Component to add resource hints to improve page load performance
 */
export const ResourceHints: React.FC<ResourceHintsProps> = ({
  preconnect = [],
  prefetch = [],
  preload = [],
  prerender = [],
  dnsPrefetch = []
}) => {
  useEffect(() => {
    const hints: HTMLLinkElement[] = [];
    
    // Add preconnect hints
    preconnect.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      hints.push(link);
    });
    
    // Add prefetch hints
    prefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      hints.push(link);
    });
    
    // Add preload hints
    preload.forEach(({ href, as, type, crossOrigin }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      if (crossOrigin) link.crossOrigin = crossOrigin;
      document.head.appendChild(link);
      hints.push(link);
    });
    
    // Add prerender hints
    prerender.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prerender';
      link.href = url;
      document.head.appendChild(link);
      hints.push(link);
    });
    
    // Add DNS prefetch hints
    dnsPrefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = url;
      document.head.appendChild(link);
      hints.push(link);
    });
    
    // Cleanup function to remove hints when component unmounts
    return () => {
      hints.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [preconnect, prefetch, preload, prerender, dnsPrefetch]);
  
  return null;
};

/**
 * Add critical resource hints to the document head immediately
 */
export const addCriticalResourceHints = (): void => {
  // Add preconnect for API server
  const apiPreconnect = document.createElement('link');
  apiPreconnect.rel = 'preconnect';
  apiPreconnect.href = 'http://localhost:3000'; // Adjust based on your API URL
  document.head.appendChild(apiPreconnect);
  
  // Preload main font
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.href = '/fonts/inter-var.woff2'; // Adjust based on your font
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.crossOrigin = 'anonymous';
  document.head.appendChild(fontPreload);
  
  // Preload main CSS
  const cssPreload = document.createElement('link');
  cssPreload.rel = 'preload';
  cssPreload.href = '/assets/index.css'; // Adjust based on your CSS path
  cssPreload.as = 'style';
  document.head.appendChild(cssPreload);
};
