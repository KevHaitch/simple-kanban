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
        
        <div class="input-container">
          <label class="field-label">Collaborators (Optional)</label>
          <textarea
            v-model="collaboratorsInput"
            placeholder="Enter email addresses, separated by commas"
            class="form-input collaborators-input"
            rows="2"
          ></textarea>
          <div class="help-text">
            Add comma-separated email addresses of people who can view this project.
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

export default {
  name: 'ProjectModal',
  components: {
    Dialog,
    DialogPanel,
    DialogTitle
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
      collaboratorsInput: this.project && this.project.collaborators ? this.project.collaborators.join(', ') : '',
    };
  },
  watch: {
    project(newProject) {
      this.projectName = newProject ? newProject.name : '';
      this.collaboratorsInput = newProject && newProject.collaborators ? newProject.collaborators.join(', ') : '';
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
    saveProject() {
      if (!this.projectName.trim()) return;
      
      const collaboratorsArray = this.collaboratorsInput && this.collaboratorsInput.trim() 
        ? this.collaboratorsInput.split(',').map(email => email.trim()).filter(email => email)
        : [];
        
      if (this.project) {
        // Update existing project
        this.$emit('update', {
          ...this.project,
          name: this.projectName.trim(),
          collaborators: collaboratorsArray
        });
      } else {
        // Create new project
        this.$emit('create', {
          name: this.projectName.trim(),
          collaborators: collaboratorsArray
        });
      }
      
      this.projectName = '';
      this.collaboratorsInput = '';
    }
  }
};
</script>
  
<style scoped lang="css">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

.modal-content {
  max-width: 450px;
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