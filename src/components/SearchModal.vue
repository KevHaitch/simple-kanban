<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Search Tasks</h2>
        <button @click="closeModal" class="close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- Search Input -->
      <div class="search-input-container">
        <form @submit.prevent="handleSearch" class="search-form">
          <input
            v-model="localSearchQuery"
            ref="searchInput"
            type="text"
            placeholder="Search tasks and/or @user ..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <div class="search-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="search-submit-btn" :disabled="!localSearchQuery.trim()">
              Search
            </button>
          </div>
        </form>
      </div>
      
      <div v-if="hasSearched" class="search-info">
        <p v-if="searchQuery">
          <span v-if="hasUsernameSearch && hasKeywordSearch">
            Found {{ results.length }} task{{ results.length !== 1 ? 's' : '' }} assigned to users matching "{{ getUsernameFromQuery }}" with "{{ getKeywordsFromQuery }}"
          </span>
          <span v-else-if="hasUsernameSearch">
            Found {{ results.length }} task{{ results.length !== 1 ? 's' : '' }} assigned to users matching "{{ getUsernameFromQuery }}"
          </span>
          <span v-else>
            Found {{ results.length }} result{{ results.length !== 1 ? 's' : '' }} for "{{ searchQuery }}"
          </span>
        </p>
      </div>
      
      <div v-if="hasSearched" class="results-container">
        <div v-if="results.length === 0 && localSearchQuery.trim()" class="no-results">
          <svg xmlns="http://www.w3.org/2000/svg" class="no-results-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>No tasks found matching your search.</p>
        </div>
        
        <div v-else class="results-list">
          <div 
            v-for="task in results" 
            :key="task.id"
            class="result-item"
            @click="openTask(task)"
          >
            <div class="task-info">
              <h3 class="task-title" v-html="highlightMatch(task.title, getKeywordsFromQuery || searchQuery)"></h3>
              <p class="task-description" v-if="task.description" v-html="highlightMatch(task.description, getKeywordsFromQuery || searchQuery)"></p>
              <div class="task-meta">
                <span class="task-status" :class="getStatusClass(task.status)">
                  {{ getStatusName(task.status) }}
                </span>
                
                <!-- Show assignee chips for searches that include username -->
                <div v-if="hasUsernameSearch && task.assignees && task.assignees.length > 0" class="assignee-chips">
                  <div 
                    v-for="(assignee, index) in getDisplayAssignees(task.assignees)" 
                    :key="assignee.email"
                    class="assignee-chip"
                  >
                    <div 
                      class="assignee-initials" 
                      :style="{ backgroundColor: assignee.color }"
                    >
                      {{ assignee.initials }}
                    </div>
                    <span class="assignee-name">{{ assignee.name }}</span>
                  </div>
                  <div v-if="getAdditionalAssigneeCount(task.assignees) > 0" class="additional-assignees">
                    +{{ getAdditionalAssigneeCount(task.assignees) }}
                  </div>
                </div>
                
                <!-- Show assignee count for searches without username -->
                <span v-else-if="task.assignees && task.assignees.length > 0" class="task-assignees">
                  {{ task.assignees.length }} assignee{{ task.assignees.length !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <div class="task-actions">
              <svg xmlns="http://www.w3.org/2000/svg" class="action-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue';
import userStore from '../userStore';
import colorService from '../services/colorService';

export default {
  name: 'SearchModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    results: {
      type: Array,
      default: () => []
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'open-task', 'search', 'update:searchQuery'],
  setup(props, { emit }) {
    const localSearchQuery = ref(props.searchQuery || '');
    const hasSearched = ref(!!props.searchQuery);
    const searchInput = ref(null);
    
    // Watch for modal opening and focus input
    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        hasSearched.value = !!props.searchQuery;
        localSearchQuery.value = props.searchQuery || '';
        nextTick(() => {
          if (searchInput.value) {
            searchInput.value.focus();
          }
        });
      }
    });
    
    // Watch for external searchQuery changes
    watch(() => props.searchQuery, (newVal) => {
      localSearchQuery.value = newVal || '';
      if (newVal) {
        hasSearched.value = true;
      }
    });
    
    const handleSearch = () => {
      if (localSearchQuery.value.trim()) {
        hasSearched.value = true;
        emit('update:searchQuery', localSearchQuery.value);
        emit('search');
      }
    };
    
    const closeModal = () => {
      emit('close');
    };
    
    const openTask = (task) => {
      emit('open-task', task);
      closeModal();
    };
    
    return {
      localSearchQuery,
      hasSearched,
      searchInput,
      handleSearch,
      closeModal,
      openTask
    };
  },
  computed: {
    hasUsernameSearch() {
      return /@\w+/.test(this.searchQuery);
    },
    hasKeywordSearch() {
      const keywords = this.searchQuery.replace(/@\w+/g, '').trim();
      return keywords.length > 0;
    },
    getUsernameFromQuery() {
      const match = this.searchQuery.match(/@(\w+)/);
      return match ? match[1] : '';
    },
    getKeywordsFromQuery() {
      return this.searchQuery.replace(/@\w+/g, '').trim();
    }
  },
  methods: {
    highlightMatch(text, query) {
      if (!query || !text) return text;
      
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    },
    getStatusName(status) {
      const statusMap = {
        'backlog': 'Backlog',
        'ready': 'Ready',
        'in-progress': 'In Progress',
        'review': 'Review',
        'qa': 'QA',
        'done': 'Done'
      };
      return statusMap[status] || status;
    },
    getStatusClass(status) {
      return `status-${status}`;
    },
    getDisplayAssignees(assignees) {
      if (!assignees || assignees.length === 0) return [];
      
      // For searches with username, show matching assignees first, then others
      const searchUsername = this.getUsernameFromQuery.toLowerCase();
      
      const matchingAssignees = [];
      const otherAssignees = [];
      
      assignees.forEach(email => {
        const firstName = userStore.getFirstNameFromEmail(email);
        const isMatch = searchUsername && firstName.toLowerCase().includes(searchUsername);
        
        const assigneeData = {
          email,
          name: firstName,
          initials: firstName.charAt(0).toUpperCase(),
          color: colorService.getColorForEmail(email)
        };
        
        if (isMatch) {
          matchingAssignees.push(assigneeData);
        } else {
          otherAssignees.push(assigneeData);
        }
      });
      
      // Show up to 2 assignees total (prioritize matching ones)
      const displayAssignees = [...matchingAssignees, ...otherAssignees].slice(0, 2);
      
      return displayAssignees;
    },
    getAdditionalAssigneeCount(assignees) {
      if (!assignees || assignees.length <= 2) return 0;
      return assignees.length - 2;
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background-color: #1a1a27;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid #2d2d3a;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #2d2d3a;
}

.modal-header h2 {
  margin: 0;
  color: #e6e6e9;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #2d2d3a;
  color: #e6e6e9;
}

.icon {
  width: 20px;
  height: 20px;
}

.search-input-container {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #2d2d3a;
  background-color: #1a1a27;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #252535;
  border: 2px solid #2d2d3a;
  border-radius: 8px;
  color: #e6e6e9;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #6366f1;
}

.search-input::placeholder {
  color: #6c6c84;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-btn {
  padding: 0.5rem 1.25rem;
  background-color: transparent;
  border: 1px solid #2d2d3a;
  border-radius: 6px;
  color: #e6e6e9;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #2d2d3a;
}

.search-submit-btn {
  padding: 0.5rem 1.25rem;
  background-color: #6366f1;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-submit-btn:hover:not(:disabled) {
  background-color: #5558e3;
}

.search-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-info {
  padding: 1rem 2rem;
  border-bottom: 1px solid #2d2d3a;
  background-color: #252535;
}

.search-info p {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.results-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #6b7280;
  text-align: center;
}

.no-results-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.results-list {
  padding: 0 1rem;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  margin-bottom: 0.5rem;
  background-color: #252535;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover {
  background-color: #2d2d3a;
  border-color: #3b3b4a;
  transform: translateY(-1px);
}

.task-info {
  flex: 1;
}

.task-title {
  margin: 0 0 0.5rem 0;
  color: #e6e6e9;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
}

.task-description {
  margin: 0 0 0.75rem 0;
  color: #9ca3af;
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.task-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-backlog {
  background-color: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.status-ready {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.status-in-progress {
  background-color: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.status-review {
  background-color: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.status-qa {
  background-color: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.status-done {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.task-assignees {
  color: #6b7280;
  font-size: 0.75rem;
}

.assignee-chips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.assignee-chip {
  display: flex;
  align-items: center;
  background-color: #2d2d3a;
  height: 24px;
  border-radius: 12px;
  padding: 2px;
  overflow: hidden;
}

.assignee-initials {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  margin-right: 6px;
  flex-shrink: 0;
}

.assignee-name {
  font-size: 0.7rem;
  color: #a1a1b5;
  white-space: nowrap;
  padding-right: 8px;
  flex: 1;
}

.additional-assignees {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3b3b4a;
  color: #9ca3af;
  font-size: 0.7rem;
  font-weight: 500;
  height: 24px;
  min-width: 32px;
  border-radius: 12px;
  padding: 0 8px;
}

.task-actions {
  margin-left: 1rem;
}

.action-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
  transition: color 0.2s ease;
}

.result-item:hover .action-icon {
  color: #9ca3af;
}

:global(mark) {
  background-color: #fbbf24;
  color: #1a1a27;
  padding: 0.1em 0.2em;
  border-radius: 3px;
  font-weight: 500;
}

/* Scrollbar styling */
.results-container::-webkit-scrollbar {
  width: 6px;
}

.results-container::-webkit-scrollbar-track {
  background: #1a1a27;
}

.results-container::-webkit-scrollbar-thumb {
  background-color: #3b3b4a;
  border-radius: 3px;
}
</style> 