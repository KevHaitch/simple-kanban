<template>
  <Dialog :open="isOpen" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
    
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="modal-content">
        <DialogTitle class="modal-title">
          {{ project ? 'Edit Project' : 'Create New Project' }}
        </DialogTitle>
        
        <div class="input-container">
          <label class="field-label">Project Name</label>
          <input 
            v-model="projectName" 
            @keyup.enter="saveProject"
            placeholder="Enter project name" 
            class="form-input"
            ref="projectNameInput"
            autofocus
          />
        </div>
        
        <div class="two-column-layout">
          <div class="left-column">
            <div class="input-container">
              <collaborator-manager
                v-model="collaborators"
              />
            </div>
          </div>
          
          <div class="right-column">
            <div class="input-container">
              <category-manager
                v-model="categories"
              />
            </div>
          </div>
        </div>
        
        <div class="actions-container">
          <button @click="$emit('close')" class="cancel-button">
            Cancel
          </button>
          <button @click="saveProject" class="save-button">
            {{ project ? 'Save Changes' : 'Create Project' }}
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
  
<script>
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import CategoryManager from './CategoryManager.vue';
import CollaboratorManager from './CollaboratorManager.vue';

export default {
  name: 'ProjectModal',
  components: {
    Dialog,
    DialogPanel,
    DialogTitle,
    CategoryManager,
    CollaboratorManager
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    project: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'create', 'update'],
  data() {
    return {
      projectName: this.project ? this.project.name : '',
      collaborators: [],
      categories: this.project && this.project.categories ? this.project.categories : [
        { id: 'general', name: 'General', color: '#3b82f6' },
        { id: 'bug', name: 'Bug', color: '#ef4444' },
        { id: 'feature', name: 'Feature', color: '#10b981' },
        { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
        { id: 'research', name: 'Research', color: '#8b5cf6' }
      ],
    };
  },
  mounted() {
    // Initialize collaborators after component is mounted
    if (this.project) {
      // Use collaboratorDetails first, fall back to collaborators for backwards compatibility
      const collaboratorData = this.project.collaboratorDetails || this.project.collaborators;
      if (collaboratorData) {
        this.collaborators = this.convertCollaborators(collaboratorData);
      }
    }
  },
  watch: {
    project(newProject) {
      this.projectName = newProject ? newProject.name : '';
      // Use collaboratorDetails first, fall back to collaborators for backwards compatibility
      const collaboratorData = newProject && (newProject.collaboratorDetails || newProject.collaborators);
      this.collaborators = collaboratorData ? this.convertCollaborators(collaboratorData) : [];
      this.categories = newProject && newProject.categories ? newProject.categories : [
        { id: 'general', name: 'General', color: '#3b82f6' },
        { id: 'bug', name: 'Bug', color: '#ef4444' },
        { id: 'feature', name: 'Feature', color: '#10b981' },
        { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
        { id: 'research', name: 'Research', color: '#8b5cf6' }
      ];
    },
    isOpen(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          this.$refs.projectNameInput?.focus();
        });
      }
    }
  },
  methods: {
    convertCollaborators(collabs) {
      if (!collabs || collabs.length === 0) return [];
      
      return collabs.map((collab, index) => {
        if (typeof collab === 'object' && collab.id) {
          return collab; // Already in new format
        }
        
        // Convert from old string format
        const email = typeof collab === 'string' ? collab : collab.email || '';
        return {
          id: email.replace(/[^a-z0-9]/gi, '-').toLowerCase() || `collaborator-${index}`,
          email: email,
          color: ['#06b6d4', '#84cc16', '#f97316', '#ec4899', '#8b5cf6'][index % 5]
        };
      });
    },
    saveProject() {
      if (!this.projectName.trim()) return;
        
      if (this.project) {
        // Update existing project
        this.$emit('update', {
          ...this.project,
          name: this.projectName.trim(),
          collaborators: this.collaborators,
          categories: this.categories
        });
        // Close modal after updating
        this.$emit('close');
      } else {
        // Create new project
        this.$emit('create', {
          name: this.projectName.trim(),
          collaborators: this.collaborators,
          categories: this.categories
        });
        
        // Only clear fields when creating a new project
        this.projectName = '';
        this.collaborators = [];
        this.categories = [
          { id: 'general', name: 'General', color: '#3b82f6' },
          { id: 'bug', name: 'Bug', color: '#ef4444' },
          { id: 'feature', name: 'Feature', color: '#10b981' },
          { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
          { id: 'research', name: 'Research', color: '#8b5cf6' }
        ];
        // Close modal after creating
        this.$emit('close');
      }
    }
  }
};
</script>
  
<style scoped lang="css">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

.modal-content {
  max-width: 700px;
  width: 100%;
  background-color: #1a1a27;
  padding: 1.75rem;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  border: 1px solid #2d2d3a;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e6e6e9;
  margin-bottom: 1.5rem;
}

.input-container {
  margin-bottom: 1.5rem;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
}

.right-column {
  padding-left: 1.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.left-column .input-container,
.right-column .input-container {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 450px;
  }
  
  .two-column-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .right-column {
    padding-left: 0;
    padding-top: 1rem;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #a1a1b5;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
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

.help-text {
  font-size: 0.8rem;
  color: #6c6c84;
  margin-top: 0.5rem;
}

.actions-container {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
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

.save-button {
  padding: 0.5rem 1rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button:hover {
  background-color: #4f46e5;
  transform: translateY(-1px);
}
</style> 