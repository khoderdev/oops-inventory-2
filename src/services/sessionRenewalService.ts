import { authAPI, tokenManager } from "../api/auth";
import { isSessionCloseToExpiry } from "../utils/session";

export interface SessionRenewalConfig {
  checkInterval: number;
  renewalThreshold: number;
  warningThreshold: number;
  maxRenewalAttempts: number;
}

export interface SessionWarningCallback {
  (timeRemaining: number): void;
}

export interface SessionExpiredCallback {
  (): void;
}

class SessionRenewalService {
  private config: SessionRenewalConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private renewalAttempts = 0;
  private isRenewing = false;
  private warningCallback: SessionWarningCallback | null = null;
  private expiredCallback: SessionExpiredCallback | null = null;
  private lastWarningTime = 0;

  constructor(config: Partial<SessionRenewalConfig> = {}) {
    this.config = {
      checkInterval: 2,
      renewalThreshold: 30,
      warningThreshold: 10,
      maxRenewalAttempts: 3,
      ...config
    };
  }

  start(): void {
    if (this.checkInterval) {
      this.stop();
    }
    console.log("🔄 Starting session renewal service", {
      checkInterval: `${this.config.checkInterval} minutes`,
      renewalThreshold: `${this.config.renewalThreshold} minutes`,
      warningThreshold: `${this.config.warningThreshold} minutes`
    });
    this.checkInterval = setInterval(
      () => {
        this.checkAndRenewSession();
      },
      this.config.checkInterval * 60 * 1000
    );
    this.checkAndRenewSession();
  }
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.renewalAttempts = 0;
    this.isRenewing = false;
    console.log("⏹️ Session renewal service stopped");
  }
  onSessionWarning(callback: SessionWarningCallback): void {
    this.warningCallback = callback;
  }
  onSessionExpired(callback: SessionExpiredCallback): void {
    this.expiredCallback = callback;
  }
  async renewSession(): Promise<boolean> {
    if (this.isRenewing) {
      console.log("⏳ Session renewal already in progress");
      return false;
    }
    try {
      this.isRenewing = true;
      console.log("🔄 Manually renewing session...");
      const response = await authAPI.refreshToken();
      tokenManager.setToken(response.token, undefined, response.expiresAt);
      this.renewalAttempts = 0;
      console.log("✅ Session renewed successfully");
      return true;
    } catch (error) {
      console.error("❌ Manual session renewal failed:", error);
      this.renewalAttempts++;
      return false;
    } finally {
      this.isRenewing = false;
    }
  }

  getSessionStatus(): {
    isValid: boolean;
    timeUntilExpiry: number | null;
    needsRenewal: boolean;
    needsWarning: boolean;
  } {
    const sessionInfo = tokenManager.getSessionInfo();
    if (!sessionInfo?.expiresAt) {
      return {
        isValid: false,
        timeUntilExpiry: null,
        needsRenewal: false,
        needsWarning: false
      };
    }
    const expiryDate = new Date(sessionInfo.expiresAt);
    const now = new Date();
    const timeUntilExpiry = Math.max(0, expiryDate.getTime() - now.getTime());
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
    return {
      isValid: timeUntilExpiry > 0,
      timeUntilExpiry: minutesUntilExpiry,
      needsRenewal: minutesUntilExpiry <= this.config.renewalThreshold,
      needsWarning: minutesUntilExpiry <= this.config.warningThreshold
    };
  }

  private async checkAndRenewSession(): Promise<void> {
    const token = tokenManager.getToken();
    if (!token) {
      console.log("🔍 No token found, skipping session check");
      return;
    }
    const status = this.getSessionStatus();
    if (!status.isValid) {
      console.log("❌ Session has expired");
      this.handleSessionExpired();
      return;
    }
    if (status.needsWarning && status.timeUntilExpiry !== null) {
      const now = Date.now();
      if (now - this.lastWarningTime > 60000) {
        this.lastWarningTime = now;
        console.log(`⚠️ Session expires in ${status.timeUntilExpiry} minutes`);
        this.warningCallback?.(status.timeUntilExpiry);
      }
    }
    if (status.needsRenewal && !this.isRenewing) {
      await this.attemptRenewal();
    }
  }

  private async attemptRenewal(): Promise<void> {
    if (this.renewalAttempts >= this.config.maxRenewalAttempts) {
      console.log("❌ Maximum renewal attempts reached, forcing logout");
      this.handleSessionExpired();
      return;
    }
    try {
      this.isRenewing = true;
      this.renewalAttempts++;
      console.log(`🔄 Attempting session renewal (attempt ${this.renewalAttempts}/${this.config.maxRenewalAttempts})`);
      const response = await authAPI.refreshToken();
      tokenManager.setToken(response.token, undefined, response.expiresAt);
      this.renewalAttempts = 0;
      console.log("✅ Session renewed automatically");
    } catch (error) {
      console.error(`❌ Session renewal attempt ${this.renewalAttempts} failed:`, error);
      if (this.renewalAttempts >= this.config.maxRenewalAttempts) {
        console.log("❌ All renewal attempts failed, session will expire");
        this.handleSessionExpired();
      }
    } finally {
      this.isRenewing = false;
    }
  }

  private handleSessionExpired(): void {
    this.stop();
    this.expiredCallback?.();
  }

  updateConfig(newConfig: Partial<SessionRenewalConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Session renewal config updated:", this.config);
  }

  getConfig(): SessionRenewalConfig {
    return { ...this.config };
  }
}

export const sessionRenewalService = new SessionRenewalService();
export default SessionRenewalService;
