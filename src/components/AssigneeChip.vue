<template>
  <div class="assignee-chip" :class="{ 'avatar-only': avatarOnly }">
    <div 
      class="assignee-initials" 
      :style="{ backgroundColor: initialsColor }"
      :data-email="email"
    >
      {{ getInitials(email) }}
    </div>
    <span v-if="!avatarOnly" class="assignee-name">{{ displayName }}</span>
    <button
      v-if="removable && !avatarOnly"
      @click.stop="$emit('remove', email)"
      class="remove-button"
    >
      ×
    </button>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import userStore from '../userStore';
import colorService from '../services/colorService';

export default {
  name: 'AssigneeChip',
  props: {
    email: {
      type: String,
      required: true
    },
    removable: {
      type: Boolean,
      default: false
    },
    avatarOnly: {
      type: Boolean,
      default: false
    },
    boardCollaborators: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    // Initialize with the first name from email as fallback
    const displayName = ref(userStore.getFirstNameFromEmail(props.email));
    
    // Get color from board collaborators first, then fall back to colorService
    const initialsColor = computed(() => {
      console.log(`AssigneeChip debug for ${props.email}:`, {
        boardCollaborators: props.boardCollaborators,
        boardCollaboratorsLength: props.boardCollaborators?.length
      });
      
      // For boardCollaborators passed from the parent, look for the color
      // This could be either the collaboratorDetails array or legacy format
      if (props.boardCollaborators && props.boardCollaborators.length > 0) {
        const collaborator = props.boardCollaborators.find(collab => 
          (typeof collab === 'object' && collab.email === props.email) ||
          (typeof collab === 'string' && collab === props.email)
        );
        
        console.log(`Found collaborator for ${props.email}:`, collaborator);
        
        if (collaborator && typeof collaborator === 'object' && collaborator.color) {
          console.log(`Using board color for ${props.email}:`, collaborator.color);
          return collaborator.color;
        }
      }
      
      // Fall back to colorService for consistent colors
      const fallbackColor = colorService.getColorForEmail(props.email);
      console.log(`Using fallback color for ${props.email}:`, fallbackColor);
      return fallbackColor;
    });
    
    onMounted(async () => {
      try {
        // Try to get user profile from the store
        const userProfile = await userStore.getUserByEmail(props.email);
        
        // Use the first name if available
        if (userProfile && userProfile.firstName) {
          displayName.value = userProfile.firstName;
        }
      } catch (error) {
        console.error('Error getting user profile:', error);
      }
    });
    
    function getInitials(email) {
      if (!email) return '?';
      
      // If we have a display name, use the first letter of that
      if (displayName.value) {
        return displayName.value.charAt(0).toUpperCase();
      }
      
      // Fallback to the first letter of the email username
      const username = email.split('@')[0];
      return username.charAt(0).toUpperCase();
    }
    
    return {
      displayName,
      getInitials,
      initialsColor
    };
  }
};
</script>

<style scoped>
.assignee-chip {
  display: flex;
  align-items: center;
  background-color: #2d2d3a;
  height: 30px;
  border-radius: 15px; /* 50% border radius */
  padding: 3px;
  max-width: 100%;
  overflow: hidden; /* Ensure content doesn't overflow the rounded corners */
  position: relative; /* For proper positioning of the remove button */
}

.assignee-chip.avatar-only {
  background: transparent;
  padding: 0;
  height: 26px;
  width: 26px;
  border-radius: 50%;
}

.assignee-initials {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  margin-right: 8px;
  flex-shrink: 0;
}

.assignee-chip.avatar-only .assignee-initials {
  width: 26px;
  height: 26px;
  margin-right: 0;
}

.assignee-name {
  font-size: 0.75rem;
  color: #a1a1b5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 10px; /* Add padding to the name instead of the container */
  flex: 1;
}

.remove-button {
  margin-left: auto;
  font-size: 1.25rem;
  line-height: 30px;
  color: #a1a1b5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  padding: 0;
  background: transparent;
  border: none;
  position: relative;
  right: 0;
  border-radius: 50%;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.remove-button:hover {
  color: #ff5a65; /* Match the delete button color from TaskModal */
  background-color: rgba(255, 90, 101, 0.1); /* Slight background highlight on hover */
}
</style> 