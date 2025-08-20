/**
 * Backup Progress Tracker
 *
 * This module provides a mechanism to track and report the progress of database backup operations.
 * It uses an in-memory store to track progress for each backup operation by ID.
 */

// In-memory store for backup progress
const backupProgressStore = new Map();

// Backup progress steps with estimated weights
const BACKUP_STEPS = {
  INITIALIZING: { weight: 5, message: "Initializing backup process" },
  PREPARING_DATABASE: { weight: 10, message: "Preparing database connection" },
  DUMPING_SCHEMA: { weight: 20, message: "Dumping database schema" },
  DUMPING_DATA: { weight: 50, message: "Dumping database data" },
  CREATING_INDEXES: { weight: 10, message: "Creating indexes and constraints" },
  FINALIZING: { weight: 5, message: "Finalizing backup files" }
};

// Calculate total weight for percentage calculations
const TOTAL_WEIGHT = Object.values(BACKUP_STEPS).reduce((sum, step) => sum + step.weight, 0);

/**
 * Initialize a new backup progress tracking
 * @param {string} backupId - Unique identifier for the backup
 * @returns {Object} Initial progress object
 */
function initializeProgress(backupId) {
  const progress = {
    backupId,
    status: "starting",
    progress: 0,
    message: BACKUP_STEPS.INITIALIZING.message,
    currentStep: "Initializing",
    startTime: Date.now(),
    estimatedTimeRemaining: null,
    stepProgress: 0,
    currentStepKey: "INITIALIZING"
  };

  backupProgressStore.set(backupId, progress);
  return progress;
}

/**
 * Update the progress of a backup operation
 * @param {string} backupId - Unique identifier for the backup
 * @param {string} stepKey - Current step key (from BACKUP_STEPS)
 * @param {number} stepProgress - Progress within the current step (0-100)
 * @returns {Object} Updated progress object
 */
function updateProgress(backupId, stepKey, stepProgress = 0) {
  if (!backupProgressStore.has(backupId)) {
    return initializeProgress(backupId);
  }

  const progress = backupProgressStore.get(backupId);
  const step = BACKUP_STEPS[stepKey];

  if (!step) {
    console.error(`Invalid step key: ${stepKey}`);
    return progress;
  }

  // Calculate overall progress based on step weights
  let completedWeight = 0;
  let currentStepIndex = 0;
  let foundCurrentStep = false;

  const stepKeys = Object.keys(BACKUP_STEPS);
  for (let i = 0; i < stepKeys.length; i++) {
    const key = stepKeys[i];
    if (key === stepKey) {
      currentStepIndex = i;
      foundCurrentStep = true;
      completedWeight += (BACKUP_STEPS[key].weight * stepProgress) / 100;
      break;
    } else {
      completedWeight += BACKUP_STEPS[key].weight;
    }
  }

  const overallProgress = (completedWeight / TOTAL_WEIGHT) * 100;

  // Calculate estimated time remaining
  let estimatedTimeRemaining = null;
  if (overallProgress > 0) {
    const elapsedMs = Date.now() - progress.startTime;
    const estimatedTotalMs = (elapsedMs / overallProgress) * 100;
    estimatedTimeRemaining = Math.round((estimatedTotalMs - elapsedMs) / 1000); // in seconds
  }

  // Update progress object
  progress.status = "in_progress";
  progress.progress = Math.min(Math.round(overallProgress * 10) / 10, 99.9); // Round to 1 decimal, cap at 99.9%
  progress.message = step.message;
  progress.currentStep = `Step ${currentStepIndex + 1}/${stepKeys.length}: ${step.message}`;
  progress.estimatedTimeRemaining = estimatedTimeRemaining;
  progress.stepProgress = stepProgress;
  progress.currentStepKey = stepKey;

  backupProgressStore.set(backupId, progress);
  return progress;
}

/**
 * Complete a backup operation
 * @param {string} backupId - Unique identifier for the backup
 * @param {boolean} success - Whether the backup completed successfully
 * @param {string} message - Optional completion message
 * @returns {Object} Final progress object
 */
function completeProgress(backupId, success = true, message = null) {
  if (!backupProgressStore.has(backupId)) {
    return null;
  }

  const progress = backupProgressStore.get(backupId);

  progress.status = success ? "completed" : "failed";
  progress.progress = success ? 100 : progress.progress;
  progress.message = message || (success ? "Backup completed successfully" : "Backup failed");
  progress.currentStep = success ? "Finished" : "Failed";
  progress.estimatedTimeRemaining = 0;
  progress.endTime = Date.now();
  progress.duration = (progress.endTime - progress.startTime) / 1000; // in seconds

  // Keep completed backups in store for a limited time (30 minutes)
  setTimeout(
    () => {
      backupProgressStore.delete(backupId);
    },
    30 * 60 * 1000
  );

  return progress;
}

/**
 * Get the current progress of a backup operation
 * @param {string} backupId - Unique identifier for the backup
 * @returns {Object|null} Current progress object or null if not found
 */
function getProgress(backupId) {
  return backupProgressStore.has(backupId) ? backupProgressStore.get(backupId) : null;
}

/**
 * Clear progress data for a backup operation
 * @param {string} backupId - Unique identifier for the backup
 */
function clearProgress(backupId) {
  backupProgressStore.delete(backupId);
}

export default { initializeProgress, updateProgress, completeProgress, getProgress, clearProgress, BACKUP_STEPS };
