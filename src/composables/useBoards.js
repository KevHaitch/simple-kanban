/**
 * Boards management composable
 */
import { ref, computed, watch } from 'vue';
import { createBoard, updateBoard, subscribeToOwnedBoards, subscribeToCollaboratorBoards } from '../services/boardService';

export function useBoards(user) {
  const boards = ref([]);
  const selectedBoard = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Unsubscribe functions
  let unsubscribeOwned = null;
  let unsubscribeCollaborator = null;

  /**
   * Get boards where user is owner
   */
  const ownedBoards = computed(() => 
    boards.value.filter(board => board.isOwner)
  );

  /**
   * Get boards where user is collaborator
   */
  const collaboratorBoards = computed(() => 
    boards.value.filter(board => !board.isOwner)
  );

  /**
   * Check if user can edit current board
   */
  const canEditCurrentBoard = computed(() => 
    selectedBoard.value && user.value && selectedBoard.value.owner === user.value.uid
  );

  /**
   * Load boards for current user
   */
  function loadBoards() {
    if (!user.value) {
      boards.value = [];
      selectedBoard.value = null;
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Subscribe to owned boards
      unsubscribeOwned = subscribeToOwnedBoards(
        user.value.uid,
        (ownedBoardsData) => {
          // Update owned boards
          const otherBoards = boards.value.filter(b => !b.isOwner);
          boards.value = [...ownedBoardsData, ...otherBoards].sort(sortBoardsByDate);
          
          // Select appropriate board after loading
          selectAppropriateBoard();
          
          // Subscribe to collaborator boards
          if (user.value.email && !unsubscribeCollaborator) {
            unsubscribeCollaborator = subscribeToCollaboratorBoards(
              user.value.email.toLowerCase(),
              (collabBoardsData) => {
                // Filter out boards user owns (to avoid duplicates)
                const filteredCollabBoards = collabBoardsData.filter(board => 
                  !ownedBoardsData.some(owned => owned.id === board.id)
                );
                
                // Update boards list
                boards.value = [...ownedBoardsData, ...filteredCollabBoards].sort(sortBoardsByDate);
                selectAppropriateBoard();
                isLoading.value = false;
              }
            );
          } else {
            isLoading.value = false;
          }
        }
      );
    } catch (err) {
      error.value = err.message;
      console.error('Error loading boards:', err);
      isLoading.value = false;
    }
  }

  /**
   * Sort boards by creation date (newest first)
   */
  function sortBoardsByDate(a, b) {
    const timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : a.createdAt) : 0;
    const timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : b.createdAt) : 0;
    return timeB - timeA;
  }

  /**
   * Select a board and save to localStorage
   */
  function selectBoard(board) {
    selectedBoard.value = board;
    
    // Save to localStorage
    try {
      localStorage.setItem('lastUsedBoardId', board.id);
    } catch (err) {
      console.error('Error saving last used board:', err);
    }
  }

  /**
   * Select appropriate board (last used or first available)
   */
  function selectAppropriateBoard() {
    if (boards.value.length === 0 || selectedBoard.value) return;
    
    // Try to get last used board
    let lastUsedBoardId = null;
    try {
      lastUsedBoardId = localStorage.getItem('lastUsedBoardId');
    } catch (err) {
      console.error('Error reading last used board:', err);
    }
    
    // Find last used board or select first available
    let boardToSelect = null;
    if (lastUsedBoardId) {
      boardToSelect = boards.value.find(board => board.id === lastUsedBoardId);
    }
    
    if (!boardToSelect && boards.value.length > 0) {
      boardToSelect = boards.value[0];
    }
    
    if (boardToSelect) {
      selectBoard(boardToSelect);
    }
  }

  /**
   * Create a new board
   */
  async function createNewBoard(projectData) {
    if (!projectData.name || !user.value) {
      throw new Error('Project name and user are required');
    }

    try {
      error.value = null;
      const boardId = await createBoard(projectData, user.value.uid, user.value.email);
      
      // Create local board object for immediate feedback
      const newBoard = {
        id: boardId,
        name: projectData.name,
        owner: user.value.uid,
        ownerEmail: user.value.email,
        collaborators: projectData.collaborators || [],
        createdAt: new Date(),
        isOwner: true
      };
      
      // Add to local state
      boards.value.unshift(newBoard);
      selectBoard(newBoard);
      
      return newBoard;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating board:', err);
      throw err;
    }
  }

  /**
   * Update an existing board
   */
  async function updateExistingBoard(updatedProject) {
    if (!updatedProject.id || !user.value) {
      throw new Error('Project ID and user are required');
    }

    try {
      error.value = null;
      await updateBoard(updatedProject.id, {
        name: updatedProject.name,
        collaborators: updatedProject.collaborators,
        categories: updatedProject.categories
      });
      
      // Update local state
      if (selectedBoard.value && selectedBoard.value.id === updatedProject.id) {
        selectedBoard.value = { 
          ...selectedBoard.value, 
          name: updatedProject.name,
          collaborators: updatedProject.collaborators,
          categories: updatedProject.categories
        };
      }
      
      // Update in boards array
      const boardIndex = boards.value.findIndex(board => board.id === updatedProject.id);
      if (boardIndex !== -1) {
        boards.value[boardIndex].name = updatedProject.name;
        boards.value[boardIndex].collaborators = updatedProject.collaborators;
        boards.value[boardIndex].categories = updatedProject.categories;
      }
    } catch (err) {
      error.value = err.message;
      console.error('Error updating board:', err);
      throw err;
    }
  }

  /**
   * Cleanup subscriptions
   */
  function cleanup() {
    if (unsubscribeOwned) {
      unsubscribeOwned();
      unsubscribeOwned = null;
    }
    if (unsubscribeCollaborator) {
      unsubscribeCollaborator();
      unsubscribeCollaborator = null;
    }
  }

  // Watch user changes to load boards
  watch(user, (newUser) => {
    cleanup();
    if (newUser) {
      loadBoards();
    } else {
      boards.value = [];
      selectedBoard.value = null;
    }
  }, { immediate: true });

  return {
    boards,
    selectedBoard,
    isLoading,
    error,
    ownedBoards,
    collaboratorBoards,
    canEditCurrentBoard,
    selectBoard,
    createNewBoard,
    updateExistingBoard,
    loadBoards,
    cleanup
  };
}
