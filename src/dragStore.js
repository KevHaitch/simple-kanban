import { reactive, readonly } from 'vue';

// Central state for drag and drop operations
const state = reactive({
  // The task being dragged
  draggedTask: null,
  // Source column ID
  sourceColumnId: null,
  // Target column ID where task is being dragged over
  targetColumnId: null,
  // Flag to indicate if a drag operation is in progress
  isDragging: false,
  // Index where the task should be inserted in the target column
  targetIndex: -1,
  // Element that is currently being dragged over
  dragOverElement: null
});

// Methods to manipulate the state
const methods = {
  // Start dragging a task
  startDrag(task, columnId) {
    state.draggedTask = task;
    state.sourceColumnId = columnId;
    state.isDragging = true;
  },
  
  // Update the target column while dragging
  setTargetColumn(columnId) {
    state.targetColumnId = columnId;
  },
  
  // Set the target index where the task will be inserted
  setTargetIndex(index) {
    state.targetIndex = index;
  },
  
  // Set the element being dragged over
  setDragOverElement(element) {
    state.dragOverElement = element;
  },
  
  // End the drag operation
  endDrag() {
    state.isDragging = false;
    state.dragOverElement = null;
  },
  
  // Reset all state (call after a drag operation completes or cancels)
  reset() {
    state.draggedTask = null;
    state.sourceColumnId = null;
    state.targetColumnId = null;
    state.isDragging = false;
    state.targetIndex = -1;
    state.dragOverElement = null;
  },
  
  // Check if we can drop the current task in the given column
  canDropInColumn(columnId) {
    // Add logic here if certain columns have drop restrictions
    return true;
  }
};

// Helper methods for computing positions, finding drop targets, etc.
const helpers = {
  // Get the tasks in a column (to be computed from App.vue's tasks)
  getTasksInColumn(tasks, columnId) {
    return tasks.filter(task => task.status === columnId);
  },
  
  // Calculate the index where a task should be inserted based on mouse position
  calculateDropIndex(mouseY, containerRect, taskHeight, tasksCount) {
    const relativeY = mouseY - containerRect.top;
    let index = Math.floor(relativeY / taskHeight);
    
    // Ensure the index is within bounds
    return Math.max(0, Math.min(index, tasksCount));
  },
  
  // Get position data for visual feedback during dragging
  getDragVisualPosition(event, elementRect) {
    return {
      x: event.clientX - elementRect.left,
      y: event.clientY - elementRect.top
    };
  }
};

// Export a readonly version of the state and methods to prevent direct modification
export default {
  state: readonly(state),
  ...methods,
  ...helpers
}; 