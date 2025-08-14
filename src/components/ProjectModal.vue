<template>
  <div v-if="isOpen" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]" @click.self="$emit('close')"></div>
    <div class="modal-panel z-[1001] relative">
      <div class="modal-header">
        <h2>{{ project ? 'Project Settings' : 'Create New Project' }}</h2>
        <button class="icon-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
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
            <!-- Categories moved to dedicated modal -->
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn ghost" @click="$emit('close')">Cancel</button>
        <button class="btn primary" @click="saveProject">{{ project ? 'Save Changes' : 'Create Project' }}</button>
      </div>
    </div>
  </div>
</template>
  
<script>
import CategoryManager from './CategoryManager.vue';
import CollaboratorManager from './CollaboratorManager.vue';

export default {
  name: 'ProjectModal',
  components: {
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
    const initialCategories = this.project && this.project.categories ? this.project.categories : [
      { id: 'general', name: 'General', color: '#3b82f6' },
      { id: 'bug', name: 'Bug', color: '#ef4444' },
      { id: 'feature', name: 'Feature', color: '#10b981' },
      { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
      { id: 'research', name: 'Research', color: '#8b5cf6' }
    ];
    
    return {
      projectName: this.project ? this.project.name : '',
      collaborators: [],
      categories: initialCategories,
    };
  },
  mounted() {
    if (this.project) {
      const collaboratorData = this.project.collaboratorDetails || this.project.collaborators;
      if (collaboratorData) {
        this.collaborators = this.convertCollaborators(collaboratorData);
      }
    }
    if (this.isOpen) {
      this.$nextTick(() => {
        this.$refs.projectNameInput?.focus();
      });
    }
  },
  watch: {
    project(newProject) {
      this.projectName = newProject ? newProject.name : '';
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
        this.$emit('update', {
          ...this.project,
          name: this.projectName.trim(),
          collaborators: this.collaborators
        });
        this.$emit('close');
      } else {
        this.$emit('create', {
          name: this.projectName.trim(),
          collaborators: this.collaborators,
          categories: this.categories
        });
        this.projectName = '';
        this.collaborators = [];
        this.categories = [
          { id: 'general', name: 'General', color: '#3b82f6' },
          { id: 'bug', name: 'Bug', color: '#ef4444' },
          { id: 'feature', name: 'Feature', color: '#10b981' },
          { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
          { id: 'research', name: 'Research', color: '#8b5cf6' }
        ];
        this.$emit('close');
      }
    }
  }
};
</script>
  
<style scoped lang="css">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

.modal-panel {
  max-width: 700px;
  width: 100%;
  background: #1a1a27;
  border: 1px solid #2d2d3a;
  border-radius: 12px;
  color: #e6e6e9;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.3), 0 10px 10px -5px rgba(0,0,0,.2);
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #2d2d3a; }
.modal-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0; }
.icon-btn { background: transparent; border: none; color: #a1a1b5; cursor: pointer; font-size: 1.25rem; width: 32px; height: 32px; }
.modal-body { padding: 1rem 1.25rem; }
.modal-footer { padding: 0.75rem 1.25rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #2d2d3a; }
.btn { padding: 0.5rem 0.9rem; border-radius: 8px; border: 1px solid #2d2d3a; background: #252535; color: #e6e6e9; cursor: pointer; }
.btn.ghost { background: transparent; }
.btn.primary { background: #3b82f6; border-color: #3b82f6; }
.btn:disabled { opacity: .6; cursor: not-allowed; }

.input-container { margin-bottom: 1.5rem; }
.field-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #a1a1b5; }
.form-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #2d2d3a; border-radius: 8px; background-color: #252535; color: #e6e6e9; font-family: 'Poppins', sans-serif; font-size: 0.95rem; transition: all 0.2s ease; }
.form-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(86, 77, 182, 0.25); }
.form-input::placeholder { color: #6c6c84; }

.two-column-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem; }
.left-column, .right-column { display: flex; flex-direction: column; }
.right-column { padding-left: 1.5rem; border-left: 1px solid rgba(255,255,255,0.1); }
@media (max-width: 768px) { .two-column-layout { grid-template-columns: 1fr; gap: 1rem; } .right-column { padding-left: 0; padding-top: 1rem; border-left: none; border-top: 1px solid rgba(255,255,255,0.1); } }
</style> 