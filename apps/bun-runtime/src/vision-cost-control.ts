/**
 * Vision Analysis Cost Control
 * Manages API usage to prevent excessive costs
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface VisionUsageData {
  totalRequests: number;
  requestsThisRun: number;
  lastReset: string;
  dailyRequests: number;
}

export class VisionCostControl {
  private usageFile: string;
  private usage: VisionUsageData;
  private maxRequestsPerRun: number;
  private maxDailyRequests: number;
  private isCI: boolean;

  constructor(options: {
    maxRequestsPerRun?: number;
    maxDailyRequests?: number;
    usageFile?: string;
  } = {}) {
    this.maxRequestsPerRun = options.maxRequestsPerRun || 10;
    this.maxDailyRequests = options.maxDailyRequests || 100;
    this.usageFile = options.usageFile || join(process.cwd(), '.vision-usage.json');
    this.isCI = process.env.CI === 'true';
    
    this.usage = this.loadUsage();
    this.resetIfNewDay();
  }

  private loadUsage(): VisionUsageData {
    if (existsSync(this.usageFile)) {
      try {
        return JSON.parse(readFileSync(this.usageFile, 'utf-8'));
      } catch {
        // Ignore parse errors
      }
    }
    
    return {
      totalRequests: 0,
      requestsThisRun: 0,
      lastReset: new Date().toISOString(),
      dailyRequests: 0
    };
  }

  private saveUsage(): void {
    // Don't save usage in CI to avoid git changes
    if (!this.isCI) {
      writeFileSync(this.usageFile, JSON.stringify(this.usage, null, 2));
    }
  }

  private resetIfNewDay(): void {
    const lastReset = new Date(this.usage.lastReset);
    const now = new Date();
    
    if (lastReset.toDateString() !== now.toDateString()) {
      this.usage.dailyRequests = 0;
      this.usage.lastReset = now.toISOString();
      this.saveUsage();
    }
  }

  public shouldAllowRequest(): boolean {
    // Check run limit
    if (this.usage.requestsThisRun >= this.maxRequestsPerRun) {
      console.warn(`⚠️ Vision API request limit reached for this run (${this.maxRequestsPerRun})`);
      return false;
    }
    
    // Check daily limit
    if (this.usage.dailyRequests >= this.maxDailyRequests) {
      console.warn(`⚠️ Vision API daily limit reached (${this.maxDailyRequests})`);
      return false;
    }
    
    return true;
  }

  public recordRequest(): void {
    this.usage.totalRequests++;
    this.usage.requestsThisRun++;
    this.usage.dailyRequests++;
    this.saveUsage();
  }

  public getUsageStats(): {
    runUsage: number;
    dailyUsage: number;
    totalUsage: number;
    runRemaining: number;
    dailyRemaining: number;
  } {
    return {
      runUsage: this.usage.requestsThisRun,
      dailyUsage: this.usage.dailyRequests,
      totalUsage: this.usage.totalRequests,
      runRemaining: Math.max(0, this.maxRequestsPerRun - this.usage.requestsThisRun),
      dailyRemaining: Math.max(0, this.maxDailyRequests - this.usage.dailyRequests)
    };
  }

  public resetRunCounter(): void {
    this.usage.requestsThisRun = 0;
  }
}

// Singleton instance
let costControlInstance: VisionCostControl | null = null;

export function getVisionCostControl(): VisionCostControl {
  if (!costControlInstance) {
    // Load config if available
    let config = { maxRequestsPerRun: 10, maxDailyRequests: 100 };
    
    try {
      const configPath = join(process.cwd(), 'cassette.config.json');
      if (existsSync(configPath)) {
        const configData = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (configData.cassette?.visionAnalysis?.costControl) {
          const cc = configData.cassette.visionAnalysis.costControl;
          config.maxRequestsPerRun = cc.maxRequestsPerRun || config.maxRequestsPerRun;
          config.maxDailyRequests = cc.maxDailyRequests || config.maxDailyRequests;
        }
      }
    } catch {
      // Use defaults
    }
    
    costControlInstance = new VisionCostControl(config);
  }
  
  return costControlInstance;
}