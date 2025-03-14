<template>
  <Dialog :open="true" @close="$emit('close')" class="relative z-50">
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
            placeholder="Task name"
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
          <span class="field-label">Assignees</span>
          <div class="assignee-selector">
            <div v-if="localTask.assignees.length > 0" class="assignee-chips">
              <div
                v-for="assignee in localTask.assignees"
                :key="assignee"
                class="assignee-chip"
              >
                <span>{{ assignee }}</span>
                <button
                  @click="removeAssignee(assignee)"
                  class="remove-assignee"
                >
                  ×
                </button>
              </div>
            </div>
            <div class="assignee-dropdown">
              <input 
                v-model="assigneeSearch" 
                placeholder="Add assignees" 
                class="form-input assignee-input" 
                @focus="showAssigneeDropdown = true"
                @input="filterAvailableAssignees"
              />
              <div v-if="showAssigneeDropdown && filteredAvailableAssignees.length > 0" class="dropdown-menu">
                <div 
                  v-for="email in filteredAvailableAssignees" 
                  :key="email"
                  @click="addAssignee(email)"
                  class="dropdown-item"
                >
                  {{ email }}
                </div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { TrashIcon } from '@heroicons/vue/24/outline';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import debounce from 'lodash/debounce';

export default {
  name: 'TaskModal',
  components: {
    Dialog,
    DialogPanel,
    DialogTitle,
    TrashIcon
  },
  props: ['task', 'boardId'],
  setup(props, { emit }) {
    const localTask = ref({
      ...props.task,
      assignees: props.task.assignees || [],
      completedAt: props.task.completedAt || null,
    });
    const assigneesInput = ref((props.task.assignees || []).join(', '));
    const statuses = ['backlog', 'ready', 'in-progress', 'review', 'qa', 'done'];
    const showDeleteConfirmation = ref(false);
    const showAssigneeDropdown = ref(false);
    const assigneeSearch = ref('');
    const filteredAvailableAssignees = ref([]);
    const availableAssignees = ref([]);
    const projectOwnerEmail = ref('');
    const projectCollaborators = ref([]);
    const titleTextarea = ref(null);
    const descriptionTextarea = ref(null);

    onMounted(async () => {
      await fetchProjectData();
      document.addEventListener('click', closeDropdownOnClickOutside);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', closeDropdownOnClickOutside);
    });

    const fetchProjectData = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'boards', props.boardId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          projectCollaborators.value = projectData.collaborators || [];
          projectOwnerEmail.value = projectData.ownerEmail || '';
          
          availableAssignees.value = [
            projectOwnerEmail.value,
            ...projectCollaborators.value
          ].filter(Boolean);
          
          filterAvailableAssignees();
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };
    
    const closeDropdownOnClickOutside = (event) => {
      const dropdown = document.querySelector('.assignee-dropdown');
      if (dropdown && !dropdown.contains(event.target)) {
        showAssigneeDropdown.value = false;
      }
    };

    const debouncedSave = debounce(() => {
      emit('save', localTask.value);
    }, 500);

    const handleStatusChange = () => {
      if (localTask.value.status === 'done') {
        localTask.value.completedAt = new Date();
      } else if (localTask.value.completedAt) {
        localTask.value.completedAt = null;
      }
      debouncedSave();
    };

    const filterAvailableAssignees = () => {
      const searchTerm = assigneeSearch.value.toLowerCase();
      filteredAvailableAssignees.value = availableAssignees.value
        .filter(email => !localTask.value.assignees.includes(email))
        .filter(email => email.toLowerCase().includes(searchTerm));
    };

    const addAssignee = (email) => {
      if (!localTask.value.assignees.includes(email)) {
        localTask.value.assignees.push(email);
        assigneeSearch.value = '';
        filterAvailableAssignees();
        debouncedSave();
      }
      showAssigneeDropdown.value = false;
    };

    const removeAssignee = (assignee) => {
      localTask.value.assignees = localTask.value.assignees.filter(a => a !== assignee);
      filterAvailableAssignees();
      debouncedSave();
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
        debouncedSave();
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

    return {
      localTask,
      assigneesInput,
      statuses,
      showDeleteConfirmation,
      showAssigneeDropdown,
      assigneeSearch,
      filteredAvailableAssignees,
      titleTextarea,
      descriptionTextarea,
      handleStatusChange,
      filterAvailableAssignees,
      addAssignee,
      removeAssignee,
      formatCreatedAt,
      advanceStatus,
      onTitleInput,
      onDescriptionInput,
      adjustTextareaHeight,
      openDeleteConfirmation,
      deleteTask
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
  margin-bottom: 1.25rem;
}

.title-input {
  width: 100%;
  background-color: transparent;
  border: none;
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  padding: 0.5rem;
  transition: all 0.2s ease;
  resize: none;
  overflow: hidden;
  display: block;
  line-height: 1.2;
  min-height: 2.2rem;
  box-sizing: border-box;
}

.title-input:focus {
  outline: none;
  background-color: rgba(37, 37, 53, 0.5);
  border-radius: 8px;
}

.title-input::placeholder {
  color: #6c6c84;
  font-weight: 500;
}

/* Description Styling */
.description-container {
  margin-bottom: 1.25rem;
}

.description-input {
  width: 100%;
  background-color: transparent;
  border: none;
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
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
.assignee-selector {
  display: flex;
  flex-direction: column;
  margin-top: 0.5rem;
}

.assignee-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.assignee-chip {
  background-color: #2d2d3a;
  border-radius: 12px;
  padding: 0.25rem 0.75rem;
  margin-right: 0.5rem;
  font-size: 0.85rem;
  color: #e6e6e9;
}

.remove-assignee {
  background: none;
  border: none;
  color: #ff7e86;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
}

.assignee-dropdown {
  position: relative;
  flex-grow: 1;
}

.assignee-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  background-color: #252535;
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #1a1a27;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 4px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.dropdown-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: #e6e6e9;
  font-size: 0.95rem;
}

.dropdown-item:hover {
  background-color: rgba(45, 45, 58, 0.3);
}
</style>