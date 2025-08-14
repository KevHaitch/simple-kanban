/**
 * Tasks management composable
 */
import { ref, computed, watch } from 'vue';
import { createTask, updateTask, deleteTask as removeTask, subscribeToTasks, reorderTasks, moveTask } from '../services/taskService';
import { COLUMN_DEFINITIONS } from '../constants/taskStatuses';

export function useTasks(selectedBoard, user = null) {
  const tasks = ref([]);
  const selectedTask = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Unsubscribe function
  let unsubscribeTasks = null;

  /**
   * Get tasks organized by columns
   */
  const computedColumns = computed(() => {
    return COLUMN_DEFINITIONS.map((col) => ({
      ...col,
      tasks: tasks.value.filter((task) => task.status === col.id) || [],
    }));
  });

  /**
   * Get completed tasks sorted by completion date
   */
  const doneTasks = computed(() => {
    return tasks.value
      .filter((task) => task.status === 'done')
      .sort((a, b) => {
        const timeA = a.completedAt ? (typeof a.completedAt.toMillis === 'function' ? a.completedAt.toMillis() : a.completedAt.getTime()) : 0;
        const timeB = b.completedAt ? (typeof b.completedAt.toMillis === 'function' ? b.completedAt.toMillis() : b.completedAt.getTime()) : 0;
        return timeB - timeA;
      }) || [];
  });

  /**
   * Load tasks for the selected board
   */
  function loadTasks(boardId) {
    if (!boardId) {
      tasks.value = [];
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Clean up previous subscription
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }

      // Subscribe to tasks
      unsubscribeTasks = subscribeToTasks(boardId, (tasksData) => {
        tasks.value = tasksData;
        isLoading.value = false;
      });
    } catch (err) {
      error.value = err.message;
      console.error('Error loading tasks:', err);
      isLoading.value = false;
    }
  }

  /**
   * Add a new task
   */
  async function addTask(taskData) {
    if (!selectedBoard.value) {
      throw new Error('No board selected');
    }

    try {
      error.value = null;
      const taskId = await createTask(selectedBoard.value.id, taskData, tasks.value);
      return taskId;
    } catch (err) {
      error.value = err.message;
      console.error('Error adding task:', err);
      throw err;
    }
  }

  /**
   * Save/update a task
   */
  async function saveTask(task) {
    if (!selectedBoard.value) {
      throw new Error('No board selected');
    }

    if (!task.id) {
      throw new Error('Task ID is required - all tasks should be created before editing');
    }

    try {
      error.value = null;
      
      // Update existing task
      const updates = {
        title: task.title,
        description: task.description,
        assignees: task.assignees || [],
        status: task.status,
        category: task.category || 'General',
        createdAt: task.createdAt
      };

      // Only include order if it exists and is not undefined
      if (task.order !== undefined) {
        updates.order = task.order;
      }

      // Include completedAt if it exists
      if (task.completedAt) {
        updates.completedAt = task.completedAt;
      }

      await updateTask(selectedBoard.value.id, task.id, updates);
      
      // Note: Local state will be updated automatically by the real-time listener
      return task.id;
    } catch (err) {
      error.value = err.message;
      console.error('Error saving task:', err);
      throw err;
    }
  }

  /**
   * Delete a task
   */
  async function deleteTask(taskId) {
    if (!selectedBoard.value || !taskId) {
      throw new Error('Board and task ID are required');
    }

    try {
      error.value = null;
      await removeTask(selectedBoard.value.id, taskId);
      
      // Remove from local state
      tasks.value = tasks.value.filter(t => t.id !== taskId);
      
      // Clear selected task if it was deleted
      if (selectedTask.value && selectedTask.value.id === taskId) {
        selectedTask.value = null;
      }
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting task:', err);
      throw err;
    }
  }

  /**
   * Handle task moved between columns
   */
  async function handleTaskMoved({ task, newStatus, newOrder }) {
    if (!selectedBoard.value) return;

    try {
      error.value = null;
      
      // Update task with new status and order, preserving all other fields
      const updatedTask = {
        ...task,
        status: newStatus,
        order: newOrder
      };

      // Set completedAt if moving to done
      if (newStatus === 'done' && !updatedTask.completedAt) {
        updatedTask.completedAt = new Date();
      }

      await moveTask(selectedBoard.value.id, task.id, newStatus, newOrder);
      
      // Note: Local state will be updated automatically by the real-time listener
    } catch (err) {
      error.value = err.message;
      console.error('Error moving task:', err);
      throw err;
    }
  }

  /**
   * Handle tasks reordered within same column
   */
  async function handleTasksReordered({ columnId, reorderedTasks }) {
    if (!selectedBoard.value) return;

    try {
      error.value = null;
      
      // Update tasks with new order
      const tasksWithOrder = reorderedTasks.map((task, index) => ({
        ...task,
        order: index
      }));

      await reorderTasks(selectedBoard.value.id, tasksWithOrder);
      
      // Note: Local state will be updated automatically by the real-time listener
    } catch (err) {
      error.value = err.message;
      console.error('Error reordering tasks:', err);
      throw err;
    }
  }

  /**
   * Open task modal
   */
  function openTaskModal(task) {
    selectedTask.value = {
      ...task,
      assignees: task.assignees || [],
    };
  }

  /**
   * Open new task modal
   */
  async function openNewTaskModal() {
    if (!selectedBoard.value) {
      throw new Error('No board selected');
    }

    try {
      error.value = null;
      
      // Create the task immediately with minimal data - no title so user must fill it in
      const newTaskData = {
        title: '', // Empty title - user must provide
        description: '',
        assignees: [], // Empty assignees - user can add later
        status: 'backlog', // Always starts in backlog
        category: 'General', // Default category
        createdAt: new Date(),
        createdBy: user.value?.uid || null,
        createdByEmail: user.value?.email || null,
        createdByName: user.value?.displayName || user.value?.email?.split('@')[0] || 'Unknown User',
      };
      
      const taskId = await createTask(selectedBoard.value.id, newTaskData, tasks.value);
      
      // Create the full task object with ID
      const newTask = {
        ...newTaskData,
        id: taskId
      };
      
      // Wait for the real-time listener to update the tasks array with the new task
      // This ensures the task exists in the UI before we try to edit it
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds max wait
      
      while (attempts < maxAttempts) {
        const taskExists = tasks.value.find(t => t.id === taskId);
        if (taskExists) {
          // Task is now in the UI, safe to open modal
          openTaskModal(newTask);
          break;
        }
        // Wait 100ms and try again
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        // Fallback: open modal anyway after timeout
        console.warn('Task creation timed out, opening modal anyway');
        openTaskModal(newTask);
      }
      
      return taskId;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating new task:', err);
      throw err;
    }
  }

  /**
   * Close task modal
   */
  function closeTaskModal() {
    selectedTask.value = null;
  }

  /**
   * Cleanup subscriptions
   */
  function cleanup() {
    if (unsubscribeTasks) {
      unsubscribeTasks();
      unsubscribeTasks = null;
    }
  }

  // Watch selected board changes to load tasks
  watch(selectedBoard, (newBoard) => {
    cleanup();
    if (newBoard) {
      loadTasks(newBoard.id);
    } else {
      tasks.value = [];
      selectedTask.value = null;
    }
  }, { immediate: true });

  return {
    tasks,
    selectedTask,
    isLoading,
    error,
    computedColumns,
    doneTasks,
    addTask,
    saveTask,
    deleteTask,
    handleTaskMoved,
    handleTasksReordered,
    openTaskModal,
    openNewTaskModal,
    closeTaskModal,
    cleanup
  };
}
