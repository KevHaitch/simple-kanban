/**
 * Board service for managing board operations
 */
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new board
 * @param {Object} boardData - Board data
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @returns {Promise<string>} - Document ID
 */
export async function createBoard(boardData, userId, userEmail) {
  if (!boardData.name || !userId) {
    throw new Error('Board name and user ID are required');
  }
  
  // Extract emails for collaborators array (maintain query compatibility)
  const collaborators = boardData.collaborators
    ? boardData.collaborators
        .map(collab => typeof collab === 'object' ? collab.email : collab) // Extract email from object
        .filter(email => email && email.includes('@'))
        .map(email => email.trim().toLowerCase())
        .filter((email, index, self) => self.indexOf(email) === index)
    : [];
    
  // Create collaborator details for storing colors and IDs
  const collaboratorDetails = boardData.collaborators
    ? boardData.collaborators
        .map(collab => {
          if (typeof collab === 'object' && collab.email) {
            return {
              id: collab.id,
              email: collab.email.trim().toLowerCase(),
              color: collab.color
            };
          }
          return null;
        })
        .filter(collab => collab && collab.email && collab.email.includes('@'))
        .filter((collab, index, self) => self.findIndex(c => c.email === collab.email) === index)
    : [];
    
  const docRef = await addDoc(collection(db, 'boards'), {
    name: boardData.name,
    owner: userId,
    ownerEmail: userEmail,
    collaborators: collaborators,
    collaboratorDetails: collaboratorDetails,
    categories: boardData.categories || [
      { id: 'general', name: 'General', color: '#3b82f6' },
      { id: 'bug', name: 'Bug', color: '#ef4444' },
      { id: 'feature', name: 'Feature', color: '#10b981' },
      { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
      { id: 'research', name: 'Research', color: '#8b5cf6' }
    ],
    createdAt: new Date(),
  });
  
  return docRef.id;
}

/**
 * Update an existing board
 * @param {string} boardId - Board ID
 * @param {Object} updateData - Data to update
 */
export async function updateBoard(boardId, updateData) {
  if (!boardId) {
    throw new Error('Board ID is required');
  }
  
  const updates = { ...updateData };
  
  // Process collaborators if provided
  if (updates.collaborators) {
    // Extract emails for collaborators array (maintain query compatibility)
    updates.collaborators = updates.collaborators
      .map(collab => typeof collab === 'object' ? collab.email : collab) // Extract email from object
      .filter(email => email && email.includes('@'))
      .map(email => email.trim().toLowerCase())
      .filter((email, index, self) => self.indexOf(email) === index);
      
    // Create collaborator details for storing colors and IDs
    updates.collaboratorDetails = updateData.collaborators
      ? updateData.collaborators
          .map(collab => {
            if (typeof collab === 'object' && collab.email) {
              return {
                id: collab.id,
                email: collab.email.trim().toLowerCase(),
                color: collab.color
              };
            }
            return null;
          })
          .filter(collab => collab && collab.email && collab.email.includes('@'))
          .filter((collab, index, self) => self.findIndex(c => c.email === collab.email) === index)
      : [];
  }
  
  // Process categories if provided
  if (updates.categories) {
    // Categories are now objects with id, name, and color
    // Ensure each category has required fields and remove duplicates by ID
    updates.categories = updates.categories
      .filter(cat => cat && cat.id && cat.name)
      .filter((cat, index, self) => self.findIndex(c => c.id === cat.id) === index);
  }
  
  const boardRef = doc(db, 'boards', boardId);
  await updateDoc(boardRef, updates);
}

/**
 * Delete a board
 * @param {string} boardId - Board ID
 */
export async function deleteBoard(boardId) {
  if (!boardId) {
    throw new Error('Board ID is required');
  }
  
  const boardRef = doc(db, 'boards', boardId);
  await deleteDoc(boardRef);
}

/**
 * Subscribe to boards where user is owner
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToOwnedBoards(userId, callback) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const ownerQuery = query(collection(db, 'boards'), where('owner', '==', userId));
  
  return onSnapshot(
    ownerQuery,
    (snapshot) => {
      const boards = snapshot.docs.map((doc) => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data, 
          collaborators: data.collaborators || [],
          isOwner: true 
        };
      });
      callback(boards);
    },
    (error) => {
      console.error("Error fetching owned boards:", error);
      callback([]);
    }
  );
}

/**
 * Subscribe to boards where user is collaborator
 * @param {string} userEmail - User email (lowercase)
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToCollaboratorBoards(userEmail, callback) {
  if (!userEmail) {
    throw new Error('User email is required');
  }
  
  const collaboratorQuery = query(
    collection(db, 'boards'), 
    where('collaborators', 'array-contains', userEmail.toLowerCase())
  );
  
  return onSnapshot(
    collaboratorQuery,
    (snapshot) => {
      const boards = snapshot.docs.map((doc) => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          isOwner: false 
        };
      });
      callback(boards);
    },
    (error) => {
      console.error("Error fetching collaborator boards:", error);
      callback([]);
    }
  );
}
