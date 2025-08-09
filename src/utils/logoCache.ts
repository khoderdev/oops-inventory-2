import React from "react";

interface LogoCacheConfig {
  src: string;
  alt: string;
  fallbackSrc?: string;
  preload?: boolean;
}

class LogoCache {
  private static instance: LogoCache;
  private cache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();
  private preloadedLogos = new Set<string>();

  private constructor() {}

  static getInstance(): LogoCache {
    if (!LogoCache.instance) {
      LogoCache.instance = new LogoCache();
    }
    return LogoCache.instance;
  }

  /**
   * Preload logo and cache it for instant rendering
   */
  async preloadLogo(config: LogoCacheConfig): Promise<HTMLImageElement> {
    const { src, fallbackSrc } = config;

    // Return cached version if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Create loading promise
    const loadingPromise = this.loadImage(src, fallbackSrc);
    this.loadingPromises.set(src, loadingPromise);

    try {
      const img = await loadingPromise;
      this.cache.set(src, img);
      this.preloadedLogos.add(src);
      return img;
    } catch (error) {
      console.error(`Failed to preload logo: ${src}`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(src);
    }
  }

  /**
   * Load image with fallback support
   */
  private loadImage(src: string, fallbackSrc?: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        if (fallbackSrc && fallbackSrc !== src) {
          // Try fallback image
          this.loadImage(fallbackSrc).then(resolve).catch(reject);
        } else {
          reject(new Error(`Failed to load image: ${src}`));
        }
      };

      img.src = src;
    });
  }

  /**
   * Get cached logo or return loading promise
   */
  getLogo(src: string): HTMLImageElement | null {
    return this.cache.get(src) || null;
  }

  /**
   * Check if logo is preloaded and cached
   */
  isLogoPreloaded(src: string): boolean {
    return this.preloadedLogos.has(src);
  }

  /**
   * Get logo source with cache busting if needed
   */
  getLogoSrc(src: string, bustCache = false): string {
    if (bustCache) {
      const separator = src.includes("?") ? "&" : "?";
      return `${src}${separator}v=${Date.now()}`;
    }
    return src;
  }

  /**
   * Clear cache (useful for memory management)
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    this.preloadedLogos.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedLogos: this.cache.size,
      preloadedLogos: this.preloadedLogos.size,
      loadingPromises: this.loadingPromises.size
    };
  }
}

// Export singleton instance
export const logoCache = LogoCache.getInstance();

// Logo configurations
export const LOGO_CONFIGS = {
  MAIN_LOGO: {
    src: "/oops-logo.png",
    alt: "oOps Resto-Café Logo",
    fallbackSrc: "/assets/logo-fallback.png",
    preload: true
  },
  SIDEBAR_LOGO: {
    src: "oops-logo.png",
    alt: "oops-logo",
    fallbackSrc: "/assets/logo-fallback.png",
    preload: true
  },
  SIDEBAR_ICON: {
    src: "oops-icon.png",
    alt: "oOps Icon",
    fallbackSrc: "/assets/icon-fallback.png",
    preload: true
  }
} as const;

/**
 * Hook for using cached logos in React components
 */
export const useCachedLogo = (config: LogoCacheConfig) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logoSrc, setLogoSrc] = React.useState<string>(config.src);

  React.useEffect(() => {
    const loadLogo = async () => {
      try {
        // Check if already cached
        if (logoCache.isLogoPreloaded(config.src)) {
          setIsLoaded(true);
          setLogoSrc(config.src);
          return;
        }

        // Preload logo
        await logoCache.preloadLogo(config);
        setIsLoaded(true);
        setLogoSrc(config.src);
        setError(null);
      } catch (err) {
        console.error("Logo loading failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load logo");

        // Try fallback
        if (config.fallbackSrc) {
          setLogoSrc(config.fallbackSrc);
          setIsLoaded(true);
        }
      }
    };

    loadLogo();
  }, [config]);

  return {
    logoSrc,
    isLoaded,
    error,
    isPreloaded: logoCache.isLogoPreloaded(config.src)
  };
};

// Preload all logos on app initialization
export const preloadAllLogos = async (): Promise<void> => {
  const preloadPromises = Object.values(LOGO_CONFIGS)
    .filter(config => config.preload)
    .map(config => logoCache.preloadLogo(config).catch(console.error));
  await Promise.allSettled(preloadPromises);
};

export default logoCache;
