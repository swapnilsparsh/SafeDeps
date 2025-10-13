/**
 * Progress tracking types for SafeDeps scanning operations
 */

/**
 * Represents the current stage of the scanning process
 */
export enum ScanStage {
  INITIALIZING = "initializing",
  SCANNING_FILES = "scanning_files",
  PARSING_DEPENDENCIES = "parsing_dependencies",
  FETCHING_METADATA = "fetching_metadata",
  CHECKING_VULNERABILITIES = "checking_vulnerabilities",
  FINALIZING = "finalizing",
  COMPLETED = "completed",
  ERROR = "error",
}

/**
 * Progress update containing current stage and percentage
 */
export interface ProgressUpdate {
  stage: ScanStage;
  message: string;
  percentage: number;
  current?: number;
  total?: number;
  details?: string;
  elapsedTime?: number;
  estimatedTimeRemaining?: number;
  packagesPerSecond?: number;
  statistics?: {
    filesScanned?: number;
    dependenciesFound?: number;
    vulnerabilitiesFound?: number;
    outdatedPackages?: number;
  };
}

/**
 * Callback function for progress updates
 */
export type ProgressCallback = (update: ProgressUpdate) => void;

/**
 * Configuration for progress reporting
 */
export interface ProgressConfig {
  showPercentage?: boolean;
  showCount?: boolean;
  showStage?: boolean;
}
