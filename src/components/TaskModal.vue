<template>
  <Dialog :open="true" @close="handleClose" class="relative z-50">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
    
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="modal-content">
        <div class="status-row">
          <label>
            <span class="sr-only">Status</span>
            <select v-model="localTask.status" @change="handleStatusChange" class="status-select">
              <option value="backlog">Backlog</option>
              <option value="ready">Ready</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="qa">QA</option>
              <option value="done">Done</option>
            </select>
          </label>
          <button
            v-if="localTask.status !== 'done'"
            @click="advanceStatus"
            class="next-btn"
          >
            Next →
          </button>
        </div>
        
        <div class="title-container">
          <textarea
            v-model="localTask.title"
            @input="onTitleInput"
            placeholder="Enter task title..."
            class="title-input"
            rows="1"
            ref="titleTextarea"
          ></textarea>
        </div>
        
        <div class="description-container">
          <textarea
            v-model="localTask.description"
            @input="onDescriptionInput"
            placeholder="Add description"
            class="description-input"
            rows="3"
            ref="descriptionTextarea"
          ></textarea>
        </div>
        
        <div class="mb-4 relative">
          <div class="assignee-category-section">
            <div class="assignee-section">
              <button 
                @click.stop="toggleAssigneeDropdown" 
                class="assign-button"
              >
                Assign
                <svg xmlns="http://www.w3.org/2000/svg" class="plus-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </button>
              <div class="assignee-container">
                <div v-if="localTask.assignees.length > 0" class="assignee-chips">
                  <assignee-chip
                    v-for="email in localTask.assignees"
                    :key="email"
                    :email="email"
                    :projectId="boardId"
                    :removable="true"
                    :board-collaborators="projectCollaborators"
                    @remove="removeAssignee"
                  />
                </div>
                <div v-else class="no-assignees">
                  <span>No one assigned</span>
                </div>
              </div>
            </div>
            
            <div class="category-section">
              <category-chip 
                :category="localTask.category || 'General'" 
                :board-categories="availableCategories"
                :clickable="true"
                @click="toggleCategoryDropdown"
              />
            </div>
          </div>
          <div v-if="showAssigneeDropdown" class="assignee-popover">
            <div v-if="availableAssigneesToShow.length > 0" class="assignee-list">
              <div 
                v-for="email in availableAssigneesToShow" 
                :key="email"
                @click.stop="addAssignee(email)"
                class="assignee-list-item"
              >
                <assignee-chip
                  :email="email"
                  :projectId="boardId"
                  :removable="false"
                  :board-collaborators="projectCollaborators"
                  class="popover-chip"
                />
              </div>
            </div>
            <div v-else class="no-results">
              All available users are already assigned
            </div>
          </div>
          
          <div v-if="showCategoryDropdown" class="category-popover">
            <div class="category-list">
              <div 
                v-for="category in availableCategories" 
                :key="category.id"
                @click.stop="selectCategory(category)"
                class="category-list-item"
                :class="{ 'selected': localTask.category === category.id || localTask.category === category.name }"
              >
                <category-chip 
                  :category="category" 
                  :board-categories="availableCategories"
                  :clickable="false"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer-info">
          <p class="created-at">Created: {{ formatCreatedAt(localTask.createdAt) }}</p>
          <p v-if="localTask.completedAt" class="completed-at">
            Completed: {{ formatCreatedAt(localTask.completedAt) }}
          </p>
          <button v-if="!localTask.completedAt" @click="openDeleteConfirmation" class="delete-link">
            Delete
            <TrashIcon class="trash-icon" />
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
  
  <!-- Delete Confirmation Dialog -->
  <Dialog :open="showDeleteConfirmation" @close="showDeleteConfirmation = false" class="relative z-60">
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
    
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="confirmation-dialog">
        <DialogTitle class="confirmation-title">Delete task</DialogTitle>
        
        <p class="confirmation-description">
          This action cannot be undone, are you sure you want to continue?
        </p>
        
        <div class="confirmation-actions">
          <button @click="showDeleteConfirmation = false" class="cancel-button">
            Cancel
          </button>
          <button @click="deleteTask" class="delete-button">
            Delete
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { TrashIcon } from '@heroicons/vue/24/outline';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import debounce from 'lodash/debounce';
import AssigneeChip from './AssigneeChip.vue';
import CategoryChip from './CategoryChip.vue';
import userStore from '../userStore';

export default {
  name: 'TaskModal',
  components: {
    Dialog,
    DialogPanel,
    DialogTitle,
    TrashIcon,
    AssigneeChip,
    CategoryChip
  },
  props: ['task', 'boardId'],
  emits: ['close', 'save', 'delete'],
  setup(props, { emit }) {
    const localTask = ref({
      ...props.task,
      assignees: props.task.assignees || [],
      completedAt: props.task.completedAt || null,
    });
    const statuses = ['backlog', 'ready', 'in-progress', 'review', 'qa', 'done'];
    const showDeleteConfirmation = ref(false);
    const showAssigneeDropdown = ref(false);
    const showCategoryDropdown = ref(false);
    const availableAssignees = ref([]);
    const availableCategories = ref([
      { id: 'general', name: 'General', color: '#3b82f6' }
    ]);
    const projectOwnerEmail = ref('');
    const projectCollaborators = ref([]);
    const titleTextarea = ref(null);
    const descriptionTextarea = ref(null);
    const isInitialLoad = ref(true);
    const lastSavedTask = ref(JSON.stringify({
      id: localTask.value.id,
      title: localTask.value.title,
      description: localTask.value.description,
      status: localTask.value.status,
      assignees: [...(localTask.value.assignees || [])],
    }));

    // Watch for changes to the task prop
    watch(() => props.task, (newTask) => {
      if (newTask) {
        localTask.value = { ...newTask };
        // Update lastSavedTask to prevent immediate auto-save
        lastSavedTask.value = JSON.stringify({
          id: localTask.value.id,
          title: localTask.value.title,
          description: localTask.value.description,
          status: localTask.value.status,
          assignees: localTask.value.assignees,
        });
        isInitialLoad.value = true;
        
        // Adjust textarea heights after DOM updates
        nextTick(() => {
          if (titleTextarea.value) adjustTextareaHeight(titleTextarea.value);
          if (descriptionTextarea.value) adjustTextareaHeight(descriptionTextarea.value);
          
          // Auto-focus title field for new tasks (empty title)
          if (!localTask.value.title.trim()) {
            titleTextarea.value?.focus();
          }
        });
      }
    }, { immediate: true });

    // Watch for boardId changes to refetch project data (categories, assignees)
    watch(() => props.boardId, async (newBoardId) => {
      if (newBoardId) {
        await fetchProjectData();
      }
    });

    // Computed property to get available assignees that aren't already assigned
    const availableAssigneesToShow = computed(() => {
      // Make sure we have the current user's email
      const currentUserEmail = auth.currentUser?.email;
      
      // If the current user isn't in the available assignees list, add them
      if (currentUserEmail && !availableAssignees.value.includes(currentUserEmail)) {
        availableAssignees.value.push(currentUserEmail);
      }
      
      // Filter out assignees that are already assigned to the task
      return availableAssignees.value.filter(email => 
        !localTask.value.assignees.includes(email)
      );
    });

    onMounted(async () => {
      await fetchProjectData();
      document.addEventListener('click', closeDropdownOnClickOutside, true);
      adjustTextareaHeight(titleTextarea.value);
      adjustTextareaHeight(descriptionTextarea.value);
      
      // Auto-focus title field for new tasks (empty title)
      if (!localTask.value.title.trim()) {
        nextTick(() => {
          if (titleTextarea.value) {
            titleTextarea.value.focus();
            titleTextarea.value.select(); // Select placeholder text if any
          }
        });
      }
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', closeDropdownOnClickOutside, true);
    });

    const fetchProjectData = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'boards', props.boardId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          // Use collaboratorDetails for colors, fall back to collaborators for backwards compatibility
          projectCollaborators.value = projectData.collaboratorDetails || projectData.collaborators || [];
          projectOwnerEmail.value = projectData.ownerEmail || '';
          
          // Set available categories from board data
          availableCategories.value = projectData.categories || [
            { id: 'general', name: 'General', color: '#3b82f6' },
            { id: 'bug', name: 'Bug', color: '#ef4444' },
            { id: 'feature', name: 'Feature', color: '#10b981' },
            { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
            { id: 'research', name: 'Research', color: '#8b5cf6' }
          ];
          
          // Get the current user's email
          const currentUserEmail = auth.currentUser?.email;
          
          // Extract emails from collaborator objects or use strings directly
          const collaboratorEmails = projectCollaborators.value.map(collab => 
            typeof collab === 'object' ? collab.email : collab
          );
          
          // Create a Set to ensure uniqueness
          const uniqueAssignees = new Set([
            projectOwnerEmail.value,
            ...collaboratorEmails,
            currentUserEmail // Add current user
          ].filter(Boolean)); // Remove any null/undefined values
          
          // Convert back to array
          availableAssignees.value = Array.from(uniqueAssignees);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };
    
    const closeDropdownOnClickOutside = (event) => {
      // Check if either dropdown is shown
      if (!showAssigneeDropdown.value && !showCategoryDropdown.value) return;
      
      // Don't close if clicking on buttons or inside dropdowns
      if (event.target.closest('.assign-button') || 
          event.target.closest('.assignee-popover') ||
          event.target.closest('.category-section') ||
          event.target.closest('.category-popover')) {
        return;
      }
      
      // Close both dropdowns for any other clicks
      showAssigneeDropdown.value = false;
      showCategoryDropdown.value = false;
    };

    const debouncedSave = debounce(() => {
      // Skip saving during initial load
      if (isInitialLoad.value) {
        isInitialLoad.value = false;
        return;
      }
      
      // Always emit save event to ensure changes are saved
      emit('save', { ...localTask.value });
    }, 500);

    // Add a method to force save when modal is closing
    const forceSave = () => {
      // Cancel any pending debounced saves
      debouncedSave.cancel();
      
      // Always emit save event when forcing save
      emit('save', { ...localTask.value });
    };

    const handleStatusChange = () => {
      if (localTask.value.status === 'done') {
        localTask.value.completedAt = new Date();
      } else if (localTask.value.completedAt) {
        localTask.value.completedAt = null;
      }
      forceSave(); // Use forceSave instead of debouncedSave for status changes
    };

    const addAssignee = (email) => {
      if (!localTask.value.assignees.includes(email)) {
        localTask.value.assignees.push(email);
        forceSave();
      }
      // Close the dropdown after adding an assignee
      showAssigneeDropdown.value = false;
    };

    const removeAssignee = (assignee) => {
      localTask.value.assignees = localTask.value.assignees.filter(a => a !== assignee);
      forceSave();
    };

    const formatCreatedAt = (createdAt) => {
      const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
      return date instanceof Date && !isNaN(date)
        ? date.toLocaleString()
        : 'Unknown';
    };

    const advanceStatus = () => {
      const currentIndex = statuses.indexOf(localTask.value.status);
      if (currentIndex < statuses.length - 1) {
        localTask.value.status = statuses[currentIndex + 1];
        if (localTask.value.status === 'done') {
          localTask.value.completedAt = new Date();
        }
        forceSave(); // Use forceSave instead of debouncedSave for status changes
      }
    };

    const adjustTextareaHeight = (textarea) => {
      if (!textarea) return;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    const onTitleInput = (e) => {
      adjustTextareaHeight(e.target);
      debouncedSave();
    };

    const onDescriptionInput = (e) => {
      adjustTextareaHeight(e.target);
      debouncedSave();
    };

    const openDeleteConfirmation = () => {
      showDeleteConfirmation.value = true;
    };

    const deleteTask = async () => {
      try {
        if (localTask.value.id) {
          await deleteDoc(doc(db, 'boards', props.boardId, 'tasks', localTask.value.id));
        }
        emit('delete', localTask.value);
        showDeleteConfirmation.value = false;
        emit('close');
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    };

    const toggleAssigneeDropdown = () => {
      showAssigneeDropdown.value = !showAssigneeDropdown.value;
      showCategoryDropdown.value = false; // Close category dropdown
    };

    const toggleCategoryDropdown = () => {
      showCategoryDropdown.value = !showCategoryDropdown.value;
      showAssigneeDropdown.value = false; // Close assignee dropdown
    };

    const selectCategory = (category) => {
      // Store the category ID for consistency with database
      localTask.value.category = typeof category === 'object' ? category.id : category;
      showCategoryDropdown.value = false;
      forceSave();
    };

    const handleClose = () => {
      forceSave();
      emit('close');
    };

    return {
      localTask,
      statuses,
      showDeleteConfirmation,
      showAssigneeDropdown,
      showCategoryDropdown,
      availableAssignees,
      availableAssigneesToShow,
      availableCategories,
      titleTextarea,
      descriptionTextarea,
      handleStatusChange,
      addAssignee,
      removeAssignee,
      formatCreatedAt,
      advanceStatus,
      onTitleInput,
      onDescriptionInput,
      adjustTextareaHeight,
      openDeleteConfirmation,
      deleteTask,
      toggleAssigneeDropdown,
      toggleCategoryDropdown,
      selectCategory,
      forceSave,
      handleClose,
    };
  }
};
</script>

<style scoped lang="css">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

/* Base Styles */
.modal-content {
  max-width: 800px;
  width: 100%;
  background-color: #1a1a27;
  padding: 1.75rem;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  border: 1px solid #2d2d3a;
  overflow: hidden;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

label {
  display: block;
  margin: 1.25rem 0;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #a1a1b5;
}

/* Status Row */
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0;
  margin-bottom: 1.75rem;
}

.status-row label {
  flex-grow: 1;
  margin: 0;
}

.status-select {
  height: 2.5rem;
  padding: 0 1rem;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  background-color: #252535;
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(86, 77, 182, 0.25);
}

.next-btn {
  height: 2.5rem;
  width: 5rem;
  padding: 0 0.75rem;
  margin-left: 0.75rem;
  background-color: #6366f1;
  color: #FFFFFF;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.next-btn:hover {
  background-color: #4f46e5;
  transform: translateY(-1px);
}

.next-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}

/* Title Styling */
.title-container {
  margin-bottom: 1rem;
}

.title-input {
  width: 100%;
  background-color: transparent;
  border: none;
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  padding: 0.5rem;
  transition: all 0.2s ease;
  resize: none;
  overflow: hidden;
  display: block;
  line-height: 1.5;
  min-height: 1.5rem;
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
  background-color: rgba(37, 37, 53, 0.5);
  border-radius: 8px;
  color: #ffffff;
}

.title-input::placeholder {
  color: #6c6c84;
  font-weight: 500;
}

/* Description Styling */
.description-container {
  margin-bottom: 2rem;
}

.description-input {
  width: 100%;
  background-color: transparent;
  border: none;
  color: #a1a1b5;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  padding: 0.5rem;
  min-height: 1.5rem;
  resize: none;
  transition: all 0.2s ease;
  overflow: hidden;
  display: block;
  line-height: 1.5;
  box-sizing: border-box;
}

.description-input:focus {
  outline: none;
  background-color: rgba(37, 37, 53, 0.5);
  border-radius: 8px;
  color: #ffffff;
}

.description-input::placeholder {
  color: #6c6c84;
}

/* Form Input for Assignees */
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  background-color: #252535;
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(86, 77, 182, 0.25);
}

.form-input::placeholder {
  color: #6c6c84;
}

/* Footer Info */
.footer-info {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.created-at {
  font-size: 0.85rem;
  color: #6c6c84;
  margin: 0;
}

.completed-at {
  font-size: 0.85rem;
  color: #6c6c84;
  margin: 0;
}

.delete-link {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #ff7e86;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-link:hover {
  color: #ff5a65;
}

.trash-icon {
  width: 16px;
  height: 16px;
  margin-left: 5px;
  transform: translateY(-2px);
}

/* Confirmation Dialog */
.confirmation-dialog {
  max-width: 400px;
  width: 100%;
  background-color: #1a1a27;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  border: 1px solid #2d2d3a;
}

.confirmation-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e6e6e9;
  margin-bottom: 1rem;
}

.confirmation-description {
  color: #a1a1b5;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-button {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: #e6e6e9;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: rgba(45, 45, 58, 0.3);
}

.delete-button {
  padding: 0.5rem 1rem;
  background-color: #ff5a65;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-button:hover {
  background-color: #ff3540;
}

/* Assignee Selector Styles */
.assignee-category-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.assignee-section {
  display: flex;
  align-items: flex-start;
  margin-top: 0.5rem;
  position: relative;
  gap: 12px;
  flex: 1;
}

.category-section {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
}

.assignee-container {
  display: flex;
  flex: 1;
}

.assignee-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex: 1;
}

.no-assignees {
  flex: 1;
  line-height:30px;
  display: flex;
  align-items: center;
  color: #6c6c84;
  font-size: 0.9rem;
}

.assign-button {
  height: 30px;
  padding: 3px 10px 3px 15px;
  background-color: #2d2d3a;
  color: #a1a1b5;
  border-radius: 15px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0;
  flex-shrink: 0;
}

.assign-button:hover {
  background-color: #3a3a4a;
  color: #e6e6e9;
}

.plus-icon {
  width: 14px;
  height: 14px;
  margin-left: 8px;
}

.assignee-popover {
  position: absolute;
  bottom: 100%;
  left: -12px;
  width: auto;
  background-color: rgba(26, 26, 39, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  z-index: 10;
  margin-bottom: 12px;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.3);
  padding: 12px;
  white-space: nowrap;
}

.assignee-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assignee-list-item {
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: inline-block;
}

.assignee-list-item:hover .assignee-chip {
  background-color: rgba(99, 102, 241, 0.5);
}

.no-results {
  padding: 0.5rem;
  text-align: center;
  color: rgba(230, 230, 233, 0.7);
  font-size: 0.85rem;
  white-space: normal;
  min-width: 180px;
}

.popover-chip {
  display: inline-flex;
}

/* Category Dropdown Styles */
.category-popover {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: auto;
  max-width: 400px;
  background-color: rgba(26, 26, 39, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  z-index: 10;
  margin-bottom: 12px;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.3);
  padding: 12px;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.category-list::-webkit-scrollbar {
  width: 6px;
}

.category-list::-webkit-scrollbar-track {
  background: transparent;
}

.category-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.category-list-item {
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 4px;
}

.category-list-item:hover {
  background-color: rgba(99, 102, 241, 0.2);
}

.category-list-item.selected {
  background-color: rgba(99, 102, 241, 0.3);
}
</style>