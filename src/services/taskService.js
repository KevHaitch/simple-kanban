/**
 * Task service for managing task operations
 */
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new task
 * @param {string} boardId - Board ID
 * @param {Object} taskData - Task data
 * @param {Array} existingTasks - Existing tasks for order calculation
 * @returns {Promise<string>} - Document ID
 */
export async function createTask(boardId, taskData, existingTasks = []) {
  if (!boardId) {
    throw new Error('Board ID is required');
  }
  
  // Calculate order for new task
  const tasksInColumn = existingTasks.filter(t => t.status === (taskData.status || 'backlog'));
  const highestOrder = tasksInColumn.length > 0 
    ? Math.max(...tasksInColumn.map(t => t.order || 0)) 
    : -1;
  
  const newTask = {
    title: taskData.title || '', // Allow empty titles
    description: taskData.description || '',
    assignees: taskData.assignees || [],
    status: taskData.status || 'backlog',
    category: taskData.category || 'General',
    createdAt: taskData.createdAt || new Date(),
    createdBy: taskData.createdBy || null, // User ID who created the task
    createdByEmail: taskData.createdByEmail || null, // User email who created the task
    createdByName: taskData.createdByName || null, // User display name who created the task
    order: highestOrder + 1,
  };
  
  // Set completedAt if status is done
  if (taskData.status === 'done') {
    newTask.completedAt = taskData.completedAt || new Date();
  }
  
  const docRef = await addDoc(collection(db, `boards/${boardId}/tasks`), newTask);
  return docRef.id;
}

/**
 * Update an existing task
 * @param {string} boardId - Board ID
 * @param {string} taskId - Task ID
 * @param {Object} updates - Updates to apply
 */
export async function updateTask(boardId, taskId, updates) {
  if (!boardId || !taskId) {
    throw new Error('Board ID and Task ID are required');
  }
  
  const taskRef = doc(db, `boards/${boardId}/tasks`, taskId);
  
  // Handle status change to done
  if (updates.status === 'done' && !updates.completedAt) {
    updates.completedAt = new Date();
  }
  
  await updateDoc(taskRef, updates);
}

/**
 * Delete a task
 * @param {string} boardId - Board ID
 * @param {string} taskId - Task ID
 */
export async function deleteTask(boardId, taskId) {
  if (!boardId || !taskId) {
    throw new Error('Board ID and Task ID are required');
  }
  
  const taskRef = doc(db, `boards/${boardId}/tasks`, taskId);
  await deleteDoc(taskRef);
}

/**
 * Subscribe to tasks for a board
 * @param {string} boardId - Board ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToTasks(boardId, callback) {
  if (!boardId) {
    throw new Error('Board ID is required');
  }
  
  const tasksQuery = query(collection(db, `boards/${boardId}/tasks`));
  
  return onSnapshot(
    tasksQuery,
    (snapshot) => {
      const tasks = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          // First sort by status
          if (a.status !== b.status) {
            return a.status.localeCompare(b.status);
          }
          // Then sort by order within status
          return (a.order || 0) - (b.order || 0);
        });
      callback(tasks);
    },
    (error) => {
      console.error('Error loading tasks:', error);
      callback([]);
    }
  );
}

/**
 * Reorder tasks within a column
 * @param {string} boardId - Board ID
 * @param {Array} tasks - Tasks with updated order
 */
export async function reorderTasks(boardId, tasks) {
  if (!boardId || !Array.isArray(tasks)) {
    throw new Error('Board ID and tasks array are required');
  }
  
  const batch = writeBatch(db);
  
  tasks.forEach((task, index) => {
    if (task.id) {
      const taskRef = doc(db, `boards/${boardId}/tasks`, task.id);
      batch.update(taskRef, { order: index });
    }
  });
  
  await batch.commit();
}

/**
 * Move task to different column
 * @param {string} boardId - Board ID
 * @param {string} taskId - Task ID
 * @param {string} newStatus - New status
 * @param {number} newOrder - New order in target column
 */
export async function moveTask(boardId, taskId, newStatus, newOrder) {
  if (!boardId || !taskId || !newStatus) {
    throw new Error('Board ID, Task ID, and new status are required');
  }
  
  const updates = { 
    status: newStatus, 
    order: newOrder 
  };
  
  // Set completedAt when moving to done
  if (newStatus === 'done') {
    updates.completedAt = new Date();
  }
  
  await updateTask(boardId, taskId, updates);
}
