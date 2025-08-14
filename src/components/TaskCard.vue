<template>
  <div
    class="task-card"
    :class="[`status-${task.status}`, { 'is-dragging': isDragging }]"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="$emit('click', task)"
  >
    <div class="task-header">
      <h3 class="task-title" :class="{ 'empty-title': !task.title.trim() }">
        {{ task.title.trim() || 'Click to add title...' }}
      </h3>
    </div>
    
    <div v-if="task.description" class="task-description">
      {{ truncateDescription(task.description) }}
    </div>
    
    <div class="task-footer">
      <div class="assignees-category-row">
        <div class="assignees-container">
          <assignee-chip
            v-for="email in (task.assignees || [])" 
            :key="email"
            :email="email"
            :projectId="boardId"
            :removable="false"
            :avatar-only="true"
            :board-collaborators="boardCollaborators"
          />
        </div>
        
        <category-chip 
          :category="task.category || 'General'" 
          :clickable="false"
          :board-categories="boardCategories && boardCategories.length > 0 ? boardCategories : defaultCategories"
        />
      </div>
      
      <div v-if="task.status === 'done' && task.completedAt" class="completed-datetime">
        {{ formatCompletedDate(task.completedAt) }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import AssigneeChip from './AssigneeChip.vue';
import CategoryChip from './CategoryChip.vue';

export default {
  name: 'TaskCard',
  components: {
    AssigneeChip,
    CategoryChip
  },
  props: {
    task: {
      type: Object,
      required: true
    },
    boardId: {
      type: String,
      required: true
    },
    boardCollaborators: {
      type: Array,
      default: () => []
    },
    boardCategories: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const isDragging = ref(false);
    
    const defaultCategories = [
      { id: 'general', name: 'General', color: '#3b82f6' },
      { id: 'bug', name: 'Bug', color: '#ef4444' },
      { id: 'feature', name: 'Feature', color: '#10b981' },
      { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
      { id: 'research', name: 'Research', color: '#8b5cf6' }
    ];
    

    
    const onDragStart = (event) => {
      isDragging.value = true;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify(props.task));
    };
    
    const onDragEnd = () => {
      isDragging.value = false;
    };
    
    const truncateDescription = (description) => {
      if (!description) return '';
      return description.length > 100
        ? description.substring(0, 100) + '...'
        : description;
    };
    
    const formatCompletedDate = (completedAt) => {
      if (!completedAt) return '';
      
      // Handle Firestore timestamp or regular Date
      const date = completedAt?.toDate ? completedAt.toDate() : new Date(completedAt);
      
      if (!(date instanceof Date) || isNaN(date)) return '';
      
      // Format as "MMM DD, YYYY HH:MM"
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };
    
    return {
      isDragging,
      defaultCategories,
      onDragStart,
      onDragEnd,
      truncateDescription,
      formatCompletedDate
    };
  }
};
</script>

<style scoped>
.task-card {
  background-color: #1a1a27;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 4px;
  margin-bottom: 4px;
  cursor: pointer;
  border: 1px solid #2d2d3a;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.task-card.is-dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.task-header {
  margin-bottom: 8px;
}

.task-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: #e6e6e9;
  margin: 0;
  line-height: 1.4;
}

.task-title.empty-title {
  color: #6c6c84;
  font-style: italic;
  opacity: 0.8;
}

.task-description {
  font-size: 0.8rem;
  color: #a1a1b5;
  margin-bottom: 12px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  flex: 1;
}

.task-footer {
  display: flex;
  flex-direction: column;
  margin-top: auto;
  gap: 8px;
}

.assignees-category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.assignees-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.completed-datetime {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 400;
  white-space: nowrap;
  margin-left: auto;
  padding: 2px 6px;
  background-color: rgba(34, 197, 94, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* Status-specific styling */
.status-backlog {
  border-left: none;
}

.status-ready {
  border-left: none;
}

.status-in-progress {
  border-left: none;
}

.status-review {
  border-left: none;
}

.status-qa {
  border-left: none;
}

.status-done {
  border-left: none;
  opacity: 0.7;
}
</style> 