<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Search Results</h2>
        <button @click="closeModal" class="close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div class="search-info">
        <p v-if="searchQuery">
          Found {{ results.length }} result{{ results.length !== 1 ? 's' : '' }} for "{{ searchQuery }}"
        </p>
      </div>
      
      <div class="results-container">
        <div v-if="results.length === 0" class="no-results">
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
              <h3 class="task-title" v-html="highlightMatch(task.title, searchQuery)"></h3>
              <p class="task-description" v-if="task.description" v-html="highlightMatch(task.description, searchQuery)"></p>
              <div class="task-meta">
                <span class="task-status" :class="getStatusClass(task.status)">
                  {{ getStatusName(task.status) }}
                </span>
                <span v-if="task.assignees && task.assignees.length > 0" class="task-assignees">
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
  emits: ['close', 'open-task'],
  methods: {
    closeModal() {
      this.$emit('close');
    },
    openTask(task) {
      this.$emit('open-task', task);
      this.closeModal();
    },
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