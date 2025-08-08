/**
 * Empty column messages and other UI text constants
 */

export const EMPTY_COLUMN_MESSAGES = [
  "This is not the droid you're looking for",
  "Nothing to see here",
  "Get to work",
  "Be formless, shapeless, like water",
  "For fast acting relief, try slowing down",
  "Every moment is a fresh beginning",
  "The universe doesn't allow perfection",
  "Don't let the perfect be the enemy of the good"
];

/**
 * Get a random empty column message
 * @returns {string} Random message
 */
export function getRandomEmptyMessage() {
  const randomIndex = Math.floor(Math.random() * EMPTY_COLUMN_MESSAGES.length);
  return EMPTY_COLUMN_MESSAGES[randomIndex];
}

export const UI_TEXT = {
  NO_BOARD_SELECTED: 'No board selected. Choose one from the dropdown or create a new project.',
  NO_TASKS_FOUND: 'No tasks found matching your search.',
  NO_ONE_ASSIGNED: 'No one assigned',
  SEARCH_PLACEHOLDER: 'Search tasks, @username, or combine both...',
};

export const BUTTON_TEXT = {
  ADD_TASK: 'Add Task',
  CHANGELOG: 'Changelog',
  ASSIGN: 'Assign',
  NEXT: 'Next →',
  CREATE_PROJECT: 'Create Project',
  UPDATE_PROJECT: 'Update Project',
};
