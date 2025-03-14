/**
 * Utility functions for drag and drop operations
 */

/**
 * Apply consistent styling to ghost elements while preserving dimensions
 */
export function styleGhostElements() {
  setTimeout(() => {
    // Find all ghost elements and style them consistently
    const ghostElements = document.querySelectorAll('.ghost-card, .sortable-ghost');
    
    ghostElements.forEach(el => {
      // Get the original element first
      const originalEl = document.querySelector('.dragging');
      
      if (originalEl) {
        // Get computed styles of the original element
        const computedStyle = window.getComputedStyle(originalEl);
        const originalWidth = computedStyle.width;
        const originalHeight = computedStyle.height;
        const originalPadding = computedStyle.padding;
        const originalMargin = computedStyle.margin;
        
        // Apply original dimensions to ghost
        el.style.setProperty('width', originalWidth, 'important');
        el.style.setProperty('height', originalHeight, 'important');
        el.style.setProperty('padding', originalPadding, 'important');
        el.style.setProperty('margin', originalMargin, 'important');
      }
      
      // Apply ghost styling
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('border', '2px dashed #6c6c84', 'important');
      el.style.setProperty('border-radius', '6px', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('transform', 'none', 'important');
      
      // Preserve the assignee chip colors
      preserveAssigneeColors(el);
      
      // Hide most content within the ghost except for assignee chips
      const children = el.querySelectorAll('*:not(.assignee-chip):not(.assignee-initials)');
      children.forEach(child => {
        child.style.setProperty('visibility', 'hidden', 'important');
        child.style.setProperty('opacity', '0', 'important');
      });
    });
  }, 0);
}

/**
 * Reset styling by removing inline styles added during drag
 */
export function resetTaskStyling() {
  setTimeout(() => {
    // Reset all task cards to their normal appearance
    const taskCards = document.querySelectorAll('.task-card, .task-card-wrapper, .draggable-task-card');
    taskCards.forEach(el => {
      // Remove inline styles
      el.removeAttribute('style');
      
      // Remove any lingering classes from dragging
      el.classList.remove('ghost-card', 'sortable-ghost', 'dragging', 'chosen');
      
      // Also reset any children except assignee-initials (to preserve colors)
      const children = el.querySelectorAll('*:not(.assignee-initials)');
      children.forEach(child => {
        child.removeAttribute('style');
      });
    });
  }, 10);
}

/**
 * Preserve assignee chip colors during drag operations
 * @param {HTMLElement} element - The element to preserve colors in
 */
function preserveAssigneeColors(element) {
  // Find all assignee-initials elements
  const assigneeInitials = element.querySelectorAll('.assignee-initials');
  
  assigneeInitials.forEach(initials => {
    // Get the email from the data attribute
    const email = initials.getAttribute('data-email');
    if (!email) return;
    
    // Keep the background color visible
    initials.style.setProperty('visibility', 'visible', 'important');
    initials.style.setProperty('opacity', '1', 'important');
    
    // Make sure the text is visible too
    initials.style.setProperty('color', '#fff', 'important');
  });
}

/**
 * Add global styles for consistent ghost appearance
 */
export function addGlobalDragStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .ghost-card, .sortable-ghost {
      opacity: 1 !important;
      background-color: transparent !important;
      border: 2px dashed #6c6c84 !important;
      border-radius: 6px !important;
      box-shadow: none !important;
    }
    
    .ghost-card *:not(.assignee-chip):not(.assignee-initials), 
    .sortable-ghost *:not(.assignee-chip):not(.assignee-initials) {
      visibility: hidden !important;
      opacity: 0 !important;
    }
    
    .ghost-card .assignee-chip, 
    .sortable-ghost .assignee-chip {
      background-color: transparent !important;
      border: none !important;
    }
    
    .ghost-card .assignee-name, 
    .sortable-ghost .assignee-name {
      display: none !important;
    }
    
    .ghost-card .remove-button, 
    .sortable-ghost .remove-button {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
} 