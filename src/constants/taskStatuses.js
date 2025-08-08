/**
 * Task status definitions and utilities
 */

export const TASK_STATUSES = {
  BACKLOG: 'backlog',
  READY: 'ready',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  QA: 'qa',
  DONE: 'done'
};

export const COLUMN_DEFINITIONS = [
  { id: TASK_STATUSES.BACKLOG, name: 'Backlog' },
  { id: TASK_STATUSES.READY, name: 'Ready' },
  { id: TASK_STATUSES.IN_PROGRESS, name: 'In Progress' },
  { id: TASK_STATUSES.REVIEW, name: 'Review' },
  { id: TASK_STATUSES.QA, name: 'QA' },
];

export const STATUS_NAMES = {
  [TASK_STATUSES.BACKLOG]: 'Backlog',
  [TASK_STATUSES.READY]: 'Ready',
  [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
  [TASK_STATUSES.REVIEW]: 'Review',
  [TASK_STATUSES.QA]: 'QA',
  [TASK_STATUSES.DONE]: 'Done'
};

export const STATUS_PROGRESSION = [
  TASK_STATUSES.BACKLOG,
  TASK_STATUSES.READY,
  TASK_STATUSES.IN_PROGRESS,
  TASK_STATUSES.REVIEW,
  TASK_STATUSES.QA,
  TASK_STATUSES.DONE
];

/**
 * Get the next status in the progression
 * @param {string} currentStatus - Current task status
 * @returns {string|null} - Next status or null if already at the end
 */
export function getNextStatus(currentStatus) {
  const currentIndex = STATUS_PROGRESSION.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === STATUS_PROGRESSION.length - 1) {
    return null;
  }
  return STATUS_PROGRESSION[currentIndex + 1];
}

/**
 * Check if a status is valid
 * @param {string} status - Status to validate
 * @returns {boolean} - True if valid
 */
export function isValidStatus(status) {
  return Object.values(TASK_STATUSES).includes(status);
}
