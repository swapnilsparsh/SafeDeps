import { ScanStage, ProgressUpdate, ProgressCallback } from "./ProgressTypes";

/**
 * Service for reporting progress during scanning operations
 */
export class ProgressReporter {
  private callback: ProgressCallback | null = null;
  private currentStage: ScanStage = ScanStage.INITIALIZING;
  private totalSteps: number = 0;
  private completedSteps: number = 0;
  private startTime: number = 0;
  private lastUpdateTime: number = 0;
  private updateThrottleMs: number = 100; // Throttle updates to every 100ms
  private statistics: {
    filesScanned: number;
    dependenciesFound: number;
    vulnerabilitiesFound: number;
    outdatedPackages: number;
  } = {
    filesScanned: 0,
    dependenciesFound: 0,
    vulnerabilitiesFound: 0,
    outdatedPackages: 0,
  };

  /**
   * Set the progress callback to receive updates
   */
  public setCallback(callback: ProgressCallback): void {
    this.callback = callback;
  }

  /**
   * Clear the current callback
   */
  public clearCallback(): void {
    this.callback = null;
  }

  /**
   * Report progress to the callback (with throttling)
   */
  private report(update: ProgressUpdate, forceUpdate: boolean = false): void {
    if (!this.callback) {
      return;
    }

    const now = Date.now();

    // Throttle updates unless it's a stage change or forced update
    if (
      !forceUpdate &&
      this.lastUpdateTime > 0 &&
      now - this.lastUpdateTime < this.updateThrottleMs &&
      update.stage === this.currentStage
    ) {
      return;
    }

    this.lastUpdateTime = now;
    this.callback(update);
  }

  /**
   * Initialize progress tracking with total steps
   */
  public initialize(totalSteps: number): void {
    this.totalSteps = totalSteps;
    this.completedSteps = 0;
    this.currentStage = ScanStage.INITIALIZING;
    this.startTime = Date.now();
    this.lastUpdateTime = 0;
    this.statistics = {
      filesScanned: 0,
      dependenciesFound: 0,
      vulnerabilitiesFound: 0,
      outdatedPackages: 0,
    };

    this.report(
      {
        stage: ScanStage.INITIALIZING,
        message: "🚀 Initializing dependency scan...",
        percentage: 0,
        current: 0,
        total: totalSteps,
        elapsedTime: 0,
        statistics: { ...this.statistics },
      },
      true
    );
  }

  /**
   * Update stage with a custom message
   */
  public updateStage(
    stage: ScanStage,
    message: string,
    current?: number,
    total?: number,
    details?: string
  ): void {
    const isStageChange = stage !== this.currentStage;
    this.currentStage = stage;
    const percentage = this.calculatePercentage(stage, current, total);
    const elapsedTime = Date.now() - this.startTime;
    const estimatedTimeRemaining = this.calculateEstimatedTime(
      percentage,
      elapsedTime
    );
    const packagesPerSecond =
      current && elapsedTime > 0 ? current / (elapsedTime / 1000) : undefined;

    this.report(
      {
        stage,
        message: this.addStageIcon(stage, message),
        percentage,
        current,
        total,
        details,
        elapsedTime,
        estimatedTimeRemaining,
        packagesPerSecond,
        statistics: { ...this.statistics },
      },
      isStageChange
    ); // Force update on stage changes
  }

  /**
   * Add icon/emoji to stage messages
   */
  private addStageIcon(stage: ScanStage, message: string): string {
    // Don't add icon if message already starts with an emoji
    if (/^[\u{1F300}-\u{1F9FF}]/u.test(message)) {
      return message;
    }

    const icons: Record<ScanStage, string> = {
      [ScanStage.INITIALIZING]: "🚀",
      [ScanStage.SCANNING_FILES]: "🔍",
      [ScanStage.PARSING_DEPENDENCIES]: "📖",
      [ScanStage.FETCHING_METADATA]: "📦",
      [ScanStage.CHECKING_VULNERABILITIES]: "🔒",
      [ScanStage.FINALIZING]: "✨",
      [ScanStage.COMPLETED]: "✅",
      [ScanStage.ERROR]: "❌",
    };

    return `${icons[stage]} ${message}`;
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(
    percentage: number,
    elapsedTime: number
  ): number | undefined {
    if (percentage <= 0 || percentage >= 100) {
      return undefined;
    }

    const estimatedTotalTime = (elapsedTime / percentage) * 100;
    return Math.max(0, estimatedTotalTime - elapsedTime);
  }

  /**
   * Report scanning files stage
   */
  public scanningFiles(
    current: number,
    total: number,
    fileType?: string
  ): void {
    const typeInfo = fileType ? ` (${fileType})` : "";
    this.statistics.filesScanned = current;

    this.updateStage(
      ScanStage.SCANNING_FILES,
      `Scanning workspace for dependency files${typeInfo}...`,
      current,
      total,
      `Found ${current} of ${total} files`
    );
  }

  /**
   * Report parsing dependencies stage
   */
  public parsingDependencies(
    current: number,
    total: number,
    fileName?: string,
    dependencyCount?: number
  ): void {
    this.statistics.filesScanned = Math.max(
      this.statistics.filesScanned,
      current
    );
    if (dependencyCount) {
      this.statistics.dependenciesFound += dependencyCount;
    }

    const details = fileName ? `📄 ${fileName}` : undefined;
    const depInfo =
      this.statistics.dependenciesFound > 0
        ? ` • ${this.statistics.dependenciesFound} deps found`
        : "";

    this.updateStage(
      ScanStage.PARSING_DEPENDENCIES,
      `Parsing dependency files...${depInfo}`,
      current,
      total,
      details
    );
  }

  /**
   * Report fetching metadata stage
   */
  public fetchingMetadata(
    current: number,
    total: number,
    packageName?: string,
    ecosystem?: string
  ): void {
    const details = packageName
      ? `📦 ${packageName}${ecosystem ? ` (${ecosystem})` : ""}`
      : undefined;

    this.updateStage(
      ScanStage.FETCHING_METADATA,
      `Fetching package metadata from registries...`,
      current,
      total,
      details
    );
  }

  /**
   * Report checking vulnerabilities stage
   */
  public checkingVulnerabilities(
    current: number,
    total: number,
    packageName?: string,
    foundVulns?: number
  ): void {
    if (foundVulns) {
      this.statistics.vulnerabilitiesFound += foundVulns;
    }

    const details = packageName ? `🔍 ${packageName}` : undefined;
    const vulnInfo =
      this.statistics.vulnerabilitiesFound > 0
        ? ` • ${this.statistics.vulnerabilitiesFound} vulnerabilities found`
        : "";

    this.updateStage(
      ScanStage.CHECKING_VULNERABILITIES,
      `Checking for security vulnerabilities...${vulnInfo}`,
      current,
      total,
      details
    );
  }

  /**
   * Report finalizing stage
   */
  public finalizing(summary?: string): void {
    const details =
      summary ||
      `Processing ${this.statistics.dependenciesFound} dependencies from ${this.statistics.filesScanned} files`;

    this.updateStage(
      ScanStage.FINALIZING,
      "Finalizing scan results...",
      undefined,
      undefined,
      details
    );
  }

  /**
   * Report completion
   */
  public complete(message?: string): void {
    const elapsedTime = Date.now() - this.startTime;
    const defaultMessage = `Scan completed successfully in ${this.formatTime(
      elapsedTime
    )}`;
    const details = this.buildCompletionDetails();

    this.updateStage(
      ScanStage.COMPLETED,
      message || defaultMessage,
      this.totalSteps,
      this.totalSteps,
      details
    );
  }

  /**
   * Report error
   */
  public error(message: string, context?: string): void {
    const details = context ? `Context: ${context}` : undefined;

    this.updateStage(
      ScanStage.ERROR,
      `Error: ${message}`,
      undefined,
      undefined,
      details
    );
  }

  /**
   * Update statistics
   */
  public updateStatistics(stats: Partial<typeof this.statistics>): void {
    Object.assign(this.statistics, stats);
  }

  /**
   * Format time in human-readable format
   */
  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Build completion details summary
   */
  private buildCompletionDetails(): string {
    const parts: string[] = [];

    if (this.statistics.filesScanned > 0) {
      parts.push(`📁 ${this.statistics.filesScanned} files`);
    }

    if (this.statistics.dependenciesFound > 0) {
      parts.push(`📦 ${this.statistics.dependenciesFound} dependencies`);
    }

    if (this.statistics.vulnerabilitiesFound > 0) {
      parts.push(`🚨 ${this.statistics.vulnerabilitiesFound} vulnerabilities`);
    }

    if (this.statistics.outdatedPackages > 0) {
      parts.push(`📅 ${this.statistics.outdatedPackages} outdated`);
    }

    return parts.join(" • ");
  }

  /**
   * Calculate percentage based on stage and progress
   */
  private calculatePercentage(
    stage: ScanStage,
    current?: number,
    total?: number
  ): number {
    // Base percentages for each stage
    const stageWeights: Record<ScanStage, { start: number; end: number }> = {
      [ScanStage.INITIALIZING]: { start: 0, end: 5 },
      [ScanStage.SCANNING_FILES]: { start: 5, end: 15 },
      [ScanStage.PARSING_DEPENDENCIES]: { start: 15, end: 35 },
      [ScanStage.FETCHING_METADATA]: { start: 35, end: 65 },
      [ScanStage.CHECKING_VULNERABILITIES]: { start: 65, end: 90 },
      [ScanStage.FINALIZING]: { start: 90, end: 95 },
      [ScanStage.COMPLETED]: { start: 100, end: 100 },
      [ScanStage.ERROR]: { start: 0, end: 0 },
    };

    const weight = stageWeights[stage];

    if (current !== undefined && total !== undefined && total > 0) {
      // Calculate percentage within the stage range
      const stageProgress = current / total;
      const stageRange = weight.end - weight.start;
      return Math.round(weight.start + stageProgress * stageRange);
    }

    // Return the start percentage of the stage
    return weight.start;
  }

  /**
   * Increment completed steps
   */
  public incrementStep(): void {
    this.completedSteps++;
  }

  /**
   * Get current progress percentage
   */
  public getPercentage(): number {
    if (this.totalSteps === 0) {
      return 0;
    }
    return Math.round((this.completedSteps / this.totalSteps) * 100);
  }
}
