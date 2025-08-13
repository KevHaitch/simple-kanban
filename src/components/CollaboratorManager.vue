<template>
  <div class="collaborator-manager">
    <label class="field-label">Collaborators</label>
    
    <div class="collaborators-list">
      <div 
        v-for="collaborator in collaborators" 
        :key="collaborator.id"
        class="collaborator-item"
      >
        <input
          v-model="collaborator.email"
          @input="updateCollaborator(collaborator.id, 'email', $event.target.value)"
          @blur="validateEmail(collaborator.id)"
          class="collaborator-email-input"
          :class="{ 'invalid': collaborator.isInvalid }"
          placeholder="user@example.com"
          type="email"
        />
        
        <div class="color-picker-container">
          <input
            v-model="collaborator.color"
            @input="updateCollaborator(collaborator.id, 'color', $event.target.value)"
            type="color"
            class="color-picker"
            :title="`Color for ${collaborator.email}`"
          />
          <div 
            class="color-preview"
            :style="{ backgroundColor: collaborator.color }"
          ></div>
        </div>
        
        <button
          @click="removeCollaborator(collaborator.id)"
          class="remove-collaborator-btn"
          type="button"
          title="Remove collaborator"
        >
          ×
        </button>
      </div>
    </div>
    
    <button
      @click="addNewCollaborator"
      type="button"
      class="add-collaborator-btn"
    >
      <svg class="plus-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
      Add Collaborator
    </button>
    
    <div class="help-text">
      Collaborators can view and edit tasks in this project. Each gets a unique color for easy identification.
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'CollaboratorManager',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const collaborators = ref([]);

    // Default collaborator colors (different from category colors)
    const defaultColors = [
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#f97316', // Orange
      '#ec4899', // Pink
      '#8b5cf6', // Purple
      '#ef4444', // Red
      '#10b981', // Green
      '#f59e0b', // Amber
      '#6366f1', // Indigo
      '#6b7280', // Gray
    ];

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Convert old array format to new format
    const convertCollaboratorsToNewFormat = (inputCollaborators) => {
      if (!inputCollaborators || inputCollaborators.length === 0) {
        return [];
      }

      return inputCollaborators.map((collab, index) => {
        // If it's already in new format (object with id, email, color)
        if (typeof collab === 'object' && collab.id && collab.email) {
          return {
            ...collab,
            isInvalid: collab.email ? !emailRegex.test(collab.email) : false
          };
        }
        
        // Convert from old string format
        const email = typeof collab === 'string' ? collab : collab.email || '';
        const id = generateCollaboratorId(email);
        const color = collab.color || defaultColors[index % defaultColors.length];
        
        return { 
          id, 
          email, 
          color,
          isInvalid: email ? !emailRegex.test(email) : false
        };
      });
    };

    // Initialize collaborators from props
    collaborators.value = convertCollaboratorsToNewFormat(props.modelValue);

    // Watch for external changes to modelValue
    watch(() => props.modelValue, (newValue) => {
      collaborators.value = convertCollaboratorsToNewFormat(newValue);
    });

    // Generate unique ID for new collaborators
    const generateCollaboratorId = (email) => {
      const baseId = email ? email.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'collaborator';
      let id = baseId;
      let counter = 1;
      
      while (collaborators.value.some(collab => collab.id === id)) {
        id = `${baseId}-${counter}`;
        counter++;
      }
      
      return id;
    };

    // Add new collaborator
    const addNewCollaborator = () => {
      const newCollaborator = {
        id: generateCollaboratorId('new-collaborator'),
        email: '',
        color: defaultColors[collaborators.value.length % defaultColors.length],
        isInvalid: false
      };
      
      collaborators.value.push(newCollaborator);
      emitUpdate();
    };

    // Remove collaborator
    const removeCollaborator = (collaboratorId) => {
      collaborators.value = collaborators.value.filter(collab => collab.id !== collaboratorId);
      emitUpdate();
    };

    // Update collaborator property
    const updateCollaborator = (collaboratorId, property, value) => {
      const collaborator = collaborators.value.find(collab => collab.id === collaboratorId);
      if (collaborator) {
        collaborator[property] = value;
        
        // If changing email, potentially update ID and validate
        if (property === 'email') {
          const newId = generateCollaboratorId(value);
          if (newId !== collaboratorId && value.trim()) {
            collaborator.id = newId;
          }
          collaborator.isInvalid = value ? !emailRegex.test(value) : false;
        }
        
        emitUpdate();
      }
    };

    // Validate email on blur
    const validateEmail = (collaboratorId) => {
      const collaborator = collaborators.value.find(collab => collab.id === collaboratorId);
      if (collaborator) {
        collaborator.isInvalid = collaborator.email ? !emailRegex.test(collaborator.email) : false;
        emitUpdate();
      }
    };

    // Emit updates to parent (only valid collaborators)
    const emitUpdate = () => {
      const validCollaborators = collaborators.value.filter(collab => 
        collab.email && collab.email.trim() && !collab.isInvalid
      );
      emit('update:modelValue', validCollaborators);
    };

    return {
      collaborators,
      addNewCollaborator,
      removeCollaborator,
      updateCollaborator,
      validateEmail
    };
  }
};
</script>

<style scoped>
.collaborator-manager {
  width: 100%;
}

.field-label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #e6e6e9;
}

.collaborators-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.collaborator-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.collaborator-email-input {
  flex: 1;
  background-color: transparent;
  border: none;
  color: #e6e6e9;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 4px;
  outline: none;
  transition: background-color 0.2s ease;
}

.collaborator-email-input:focus {
  background-color: rgba(255, 255, 255, 0.1);
}

.collaborator-email-input.invalid {
  background-color: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
}

.collaborator-email-input.invalid:focus {
  background-color: rgba(239, 68, 68, 0.2);
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.color-picker {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  outline: none;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-preview:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.remove-collaborator-btn {
  width: 24px;
  height: 24px;
  border: none;
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-collaborator-btn:hover {
  background-color: #ef4444;
  color: white;
  transform: scale(1.1);
}

.add-collaborator-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  width: fit-content;
}

.add-collaborator-btn:hover {
  background-color: rgba(6, 182, 212, 0.3);
  border-color: rgba(6, 182, 212, 0.5);
  transform: translateY(-1px);
}

.plus-icon {
  width: 14px;
  height: 14px;
}

.help-text {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.4;
}
</style>

