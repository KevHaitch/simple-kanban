<template>
  <div class="header">
    <div class="header-title">
      <img src="../assets/kaiborg_logo.png" alt="Kaiborg Logo" class="logo" />
      <h1>{{ selectedBoard ? selectedBoard.name : 'Kaiborg' }}</h1>
    </div>
    <div class="header-actions">
      <!-- Desktop: Full search bar, Mobile: Icon button -->
      <div v-if="!isMobile" class="search-container">
        <form @submit.prevent="$emit('search')" class="search-form">
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            type="text"
            placeholder="Search tasks and/or @user ..."
            class="search-input"
            @keyup.enter="$emit('search')"
          />
          <button type="submit" class="search-btn" :disabled="!searchQuery.trim()">
            <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
      <button v-else @click="openSearchModal" class="icon-btn" title="Search">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon-only" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
      
      <!-- Add Task Button -->
      <template v-if="selectedBoard">
        <button v-if="!isMobile" @click="$emit('new-task')" class="header-btn">
          <span>Add Task</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
        <button v-else @click="$emit('new-task')" class="icon-btn" title="Add Task">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon-only" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </template>
      
      <!-- Changelog Button -->
      <template v-if="selectedBoard">
        <button v-if="!isMobile" @click="$emit('toggle-changelog')" class="header-btn">
          <span>Changelog</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button v-else @click="$emit('toggle-changelog')" class="icon-btn" title="Changelog">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon-only" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </template>
      
      <!-- User Dropdown -->
      <user-dropdown
        :user="user"
        :boards="boards"
        :selectedBoardId="selectedBoard?.id"
        :selectedBoard="selectedBoard"
        :hide-name="isMobile"
        @select-board="$emit('select-board', $event)"
        @new-project="$emit('new-project')"
        @edit-project="$emit('edit-project', $event)"
        @edit-categories="$emit('edit-categories', $event)"
        @sign-out="$emit('sign-out')"
      />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import UserDropdown from './UserDropdown.vue';
import { useBreakpoint } from '../composables/useBreakpoint';

export default {
  name: 'AppHeader',
  components: {
    UserDropdown
  },
  props: {
    user: {
      type: Object,
      required: true
    },
    selectedBoard: {
      type: Object,
      default: null
    },
    boards: {
      type: Array,
      default: () => []
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: [
    'select-board',
    'new-project', 
    'edit-project',
    'edit-categories',
    'sign-out',
    'new-task',
    'toggle-changelog',
    'search',
    'update:searchQuery',
    'open-search-modal'
  ],
  setup(props, { emit }) {
    const breakpoint = useBreakpoint();
    
    // Mobile is anything below 1200px (xl breakpoint)
    const isMobile = computed(() => breakpoint.windowWidth.value < 1200);
    
    const openSearchModal = () => {
      emit('open-search-modal');
    };
    
    return {
      isMobile,
      openSearchModal
    };
  }
};
</script>

<style scoped>
/* ============================================
   BASE STYLES (Mobile First - <576px)
   ============================================ */

/* Header Container */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  height: 40px;
  width: auto;
}

.header-title h1 {
  color: #546d99;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  transition: font-size 0.2s ease;
  display: none; /* Hidden on mobile by default */
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

/* Icon-only Buttons (Mobile) */
.icon-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  border: 3px solid #2d2d3a;
  background-color: #252535;
  color: #6c6c84;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  outline: none;
}

.icon-btn:hover {
  background-color: #2a2a3e;
  border-color: #3a3a4e;
}

.icon-only {
  width: 18px;
  height: 18px;
}

/* Full Buttons (Desktop) */
.search-form,
.header-btn {
  height: 40px;
  border-radius: 20px;
  border: 3px solid #2d2d3a;
  background-color: #252535;
  color: #6c6c84;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.search-form:hover,
.header-btn:hover {
  background-color: #2a2a3e;
  border-color: #3a3a4e;
}

.search-form:focus-within {
  border-color: #6366f1;
  background-color: #2a2a3e;
}

/* Search Form */
.search-form {
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 2px;
}

.search-input {
  min-width: 240px;
  padding: 0 0 0 1rem;
  background: transparent;
  border: none;
  color: #e6e6e9;
  font-size: 0.95rem;
  outline: none;
  height: 100%;
}

.search-input::placeholder {
  color: #6c6c84;
}

.search-btn {
  padding: 0 1rem;
  background: transparent;
  border: none;
  color: #a1a1b5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  height: 100%;
  border-radius: 18px;
}

.search-btn:hover:not(:disabled) {
  color: #6366f1;
  background-color: rgba(99, 102, 241, 0.1);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-icon {
  width: 18px;
  height: 18px;
}

/* Header Buttons */
.header-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2px 1rem;
  outline: none;
}

.header-btn:focus {
  outline: none;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* ============================================
   RESPONSIVE BREAKPOINTS (Mobile First)
   ============================================ */

/* Small (≥576px) - Show board name */
@media (min-width: 576px) {
  .header-title h1 {
    display: block;
  }
}

/* Tablet (≥768px) */
@media (min-width: 768px) {
  .header {
    padding: 1rem 1.5rem;
  }
  
  .header-title h1 {
    font-size: 1.5rem;
  }
}

/* Desktop Large (≥1200px) */
@media (min-width: 1200px) {
  .header {
    padding: 1rem 2rem;
  }
  
  .header-title h1 {
    font-size: 2rem;
  }
}
</style>
