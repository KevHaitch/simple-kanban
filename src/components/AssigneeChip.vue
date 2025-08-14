<template>
  <div class="assignee-chip" :class="{ 'avatar-only': avatarOnly }">
    <div class="avatar-circle">
      <img 
        v-if="userProfile?.photoURL && !imageError" 
        :src="getOptimizedImageUrl(userProfile.photoURL)" 
        :alt="displayName || email"
        class="avatar-image"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        @error="onImageError"
      />
      <div 
        v-else
        class="avatar-fallback" 
        :style="{ backgroundColor: fallbackColor }"
      >
        {{ getInitials(email) }}
      </div>
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
import { ref, onMounted, computed, watch } from 'vue';
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
    const userProfile = ref(null);
    const imageError = ref(false);
    
    // Get fallback color from board collaborators or colorService
    const fallbackColor = computed(() => {
      // For boardCollaborators passed from the parent, look for the color
      if (props.boardCollaborators && props.boardCollaborators.length > 0) {
        const collaborator = props.boardCollaborators.find(collab => 
          (typeof collab === 'object' && collab.email === props.email) ||
          (typeof collab === 'string' && collab === props.email)
        );
        
        if (collaborator && typeof collaborator === 'object' && collaborator.color) {
          return collaborator.color;
        }
      }
      
      // Fall back to colorService for consistent colors
      return colorService.getColorForEmail(props.email);
    });
    
    onMounted(async () => {
      try {
        // Get user profile from the store
        const profile = await userStore.getUserByEmail(props.email);
        userProfile.value = profile;
        
        // Use the first name if available
        if (profile && profile.firstName) {
          displayName.value = profile.firstName;
        }
      } catch (error) {
        console.error('Error getting user profile:', error);
      }
    });
    
    // Reset image error when user profile changes
    watch(userProfile, () => {
      imageError.value = false;
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
    
    function getOptimizedImageUrl(photoURL) {
      if (!photoURL) return null;
      
      // If it's a Google profile image, ensure it has the right parameters
      if (photoURL.includes('googleusercontent.com')) {
        // Remove existing size parameters and add our own
        const baseUrl = photoURL.split('=')[0];
        return `${baseUrl}=s48-c`; // 48px size, cropped
      }
      
      return photoURL;
    }
    
    function onImageError() {
      console.log(`Image failed to load for ${props.email}:`, userProfile.value?.photoURL);
      console.log(`Optimized URL was:`, getOptimizedImageUrl(userProfile.value?.photoURL));
      imageError.value = true;
    }
    
    return {
      displayName,
      userProfile,
      imageError,
      getInitials,
      getOptimizedImageUrl,
      fallbackColor,
      onImageError
    };
  }
};
</script>

<style scoped>
/* Base chip container - standardized 26px height */
.assignee-chip {
  display: flex;
  align-items: center;
  height: 28px;
  background-color: #2a2a3e;
  border-radius: 14px;
  padding: 2px 8px 2px 2px;
  margin-right: 0;
  margin-bottom: 4px;
  transition: background-color 0.2s;
}

.assignee-chip:hover {
  cursor: arrow;
}

/* Avatar-only mode (task cards) */
.assignee-chip.avatar-only {
  padding: 2px;
  border-radius: 50%;
  margin:0;
}

/* Avatar circle - always 24px inside 26px container */
.avatar-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

/* Avatar image */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Avatar fallback (colored initials) */
.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}

/* Name text (only in expanded mode) */
.assignee-name {
  font-size: 0.75rem;
  color: #a1a1b5;
  white-space: nowrap;
  margin-left:8px;
  margin-right: 6px;
  line-height: 1;
}

/* Remove button (only in expanded mode) */
.remove-button {
  background: none;
  border: none;
  color: #a1a1b5;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s, color 0.2s;
  flex-shrink: 0;
}

.remove-button:hover {
  cursor:pointer;
  background-color: #ff4757;
  color: #fff;
}
</style> 