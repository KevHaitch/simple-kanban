/**
 * Search utilities for task filtering
 */
import userStore from '../userStore';

/**
 * Parse search query to extract username and keywords
 * @param {string} query - Search query
 * @returns {Object} - Parsed query components
 */
export function parseSearchQuery(query) {
  if (!query) {
    return { username: null, keywords: '' };
  }
  
  // Extract @username pattern
  const usernameMatch = query.match(/@(\w+)/i);
  const username = usernameMatch ? usernameMatch[1] : null;
  
  // Remove @username from query to get remaining keywords
  const keywords = query.replace(/@\w+/gi, '').trim();
  
  return { username, keywords };
}

/**
 * Filter tasks based on search criteria
 * @param {Array} tasks - Tasks to filter
 * @param {string} searchQuery - Search query
 * @returns {Promise<Array>} - Filtered tasks
 */
export async function filterTasks(tasks, searchQuery) {
  if (!searchQuery || !Array.isArray(tasks)) {
    return [];
  }
  
  const { username, keywords } = parseSearchQuery(searchQuery);
  
  const filteredTasks = [];
  
  for (const task of tasks) {
    let matches = false;
    
    // Check keyword match in title or description
    if (keywords) {
      const keywordLower = keywords.toLowerCase();
      const titleMatch = task.title && task.title.toLowerCase().includes(keywordLower);
      const descMatch = task.description && task.description.toLowerCase().includes(keywordLower);
      
      if (!titleMatch && !descMatch) {
        continue; // Skip if keywords don't match
      }
      matches = true;
    }
    
    // Check username match in assignees
    if (username) {
      let hasMatchingAssignee = false;
      
      if (task.assignees && task.assignees.length > 0) {
        for (const email of task.assignees) {
          try {
            const userProfile = await userStore.getUserByEmail(email);
            const firstName = userProfile?.firstName || userStore.getFirstNameFromEmail(email);
            
            if (firstName && firstName.toLowerCase().startsWith(username.toLowerCase())) {
              hasMatchingAssignee = true;
              break;
            }
          } catch (error) {
            console.error('Error getting user profile for search:', error);
          }
        }
      }
      
      if (!hasMatchingAssignee) {
        continue; // Skip if username doesn't match any assignee
      }
      matches = true;
    }
    
    // If no specific criteria but we have a general query, check title/description
    if (!username && !keywords && searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const titleMatch = task.title && task.title.toLowerCase().includes(queryLower);
      const descMatch = task.description && task.description.toLowerCase().includes(queryLower);
      
      if (titleMatch || descMatch) {
        matches = true;
      }
    }
    
    if (matches) {
      filteredTasks.push(task);
    }
  }
  
  return filteredTasks;
}

/**
 * Highlight matching text in search results
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} - HTML with highlighted matches
 */
export function highlightMatches(text, query) {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Get status display information
 * @param {string} status - Task status
 * @returns {Object} - Status display info
 */
export function getStatusInfo(status) {
  const statusMap = {
    'backlog': { name: 'Backlog', class: 'status-backlog' },
    'ready': { name: 'Ready', class: 'status-ready' },
    'in-progress': { name: 'In Progress', class: 'status-in-progress' },
    'review': { name: 'Review', class: 'status-review' },
    'qa': { name: 'QA', class: 'status-qa' },
    'done': { name: 'Done', class: 'status-done' }
  };
  
  return statusMap[status] || { name: status, class: 'status-default' };
}
