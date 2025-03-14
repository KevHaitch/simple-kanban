<template>
  <div class="assignee-chip">
    <div 
      class="assignee-initials" 
      :style="{ backgroundColor: getInitialsColor(email) }"
    >
      {{ getInitials(email) }}
    </div>
    <span class="assignee-name">{{ displayName }}</span>
    <button
      v-if="removable"
      @click.stop="$emit('remove', email)"
      class="remove-button"
    >
      ×
    </button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import userStore from '../userStore';

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
    }
  },
  setup(props) {
    // Initialize with the first name from email as fallback
    const displayName = ref(userStore.getFirstNameFromEmail(props.email));
    
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
      if (!email) return '??';
      
      // Extract the part before @ symbol
      const username = email.split('@')[0];
      
      // Get first two characters, uppercase them
      return username.substring(0, 2).toUpperCase();
    }
    
    function getInitialsColor(email) {
      if (!email) return '#6366f1';
      
      // Simple hash function to generate a consistent color from email
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // Generate HSL color with fixed saturation and lightness
      const h = Math.abs(hash % 360);
      return `hsl(${h}, 70%, 65%)`;
    }
    
    return {
      displayName,
      getInitials,
      getInitialsColor
    };
  }
};
</script>

<style scoped>
.assignee-chip {
  display: flex;
  align-items: center;
  background-color: #2d2d3a;
  height: 36px;
  border-radius: 18px; /* 50% border radius */
  padding: 3px;
  max-width: 100%;
  overflow: hidden; /* Ensure content doesn't overflow the rounded corners */
  position: relative; /* For proper positioning of the remove button */
}

.assignee-initials {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  margin-right: 8px;
  flex-shrink: 0;
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