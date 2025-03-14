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
      <h3 class="task-title">{{ task.title }}</h3>
    </div>
    
    <div v-if="task.description" class="task-description">
      {{ truncateDescription(task.description) }}
    </div>
    
    <div v-if="task.assignees && task.assignees.length > 0" class="assignees-container">
      <div 
        v-for="email in task.assignees" 
        :key="email" 
        class="assignee"
      >
        <div 
          class="assignee-initials" 
          :style="{ backgroundColor: getInitialsColor(email) }"
        >
          {{ getInitials(email) }}
        </div>
        <span class="assignee-email">{{ email }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'TaskCard',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  setup() {
    const isDragging = ref(false);
    
    const truncateDescription = (description) => {
      if (!description) return '';
      return description.length > 100
        ? description.substring(0, 100) + '...'
        : description;
    };
    
    const getInitials = (email) => {
      if (!email) return '??';
      
      // Extract the part before @ symbol
      const username = email.split('@')[0];
      
      // Get first two characters, uppercase them
      return username.substring(0, 2).toUpperCase();
    };
    
    const getInitialsColor = (email) => {
      if (!email) return '#6366f1';
      
      // Simple hash function to generate a consistent color from email
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // Generate HSL color with fixed saturation and lightness
      const h = Math.abs(hash % 360);
      return `hsl(${h}, 70%, 65%)`;
    };
    
    const onDragStart = (event) => {
      isDragging.value = true;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({
        id: event.target.id,
        taskId: event.target.dataset.taskId || ''
      }));
      
      // Set task data for the drag operation
      if (event.dataTransfer.setData) {
        event.dataTransfer.setData('application/json', JSON.stringify({
          taskId: event.currentTarget.dataset.taskId || event.currentTarget.id
        }));
      }
      
      // Add a class to the element being dragged
      event.target.classList.add('is-dragging');
    };
    
    const onDragEnd = () => {
      isDragging.value = false;
    };
    
    return {
      isDragging,
      truncateDescription,
      getInitials,
      getInitialsColor,
      onDragStart,
      onDragEnd
    };
  }
};
</script>

<style scoped>
.task-card {
  background-color: #1a1a27;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  border: 1px solid #2d2d3a;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-color: #3f3f5a;
}

.task-card.is-dragging {
  opacity: 0.5;
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.task-title {
  font-size: 1rem;
  font-weight: 600;
  color: #e6e6e9;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

.task-description {
  font-size: 0.85rem;
  color: #a1a1b5;
  margin-bottom: 1rem;
  line-height: 1.5;
  word-break: break-word;
}

.assignees-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.assignee {
  display: flex;
  align-items: center;
  max-width: 100%;
}

.assignee-initials {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.assignee-email {
  font-size: 0.75rem;
  color: #a1a1b5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status-specific styling */
.status-backlog {
  border-left: 3px solid #6c6c84;
}

.status-ready {
  border-left: 3px solid #6366f1;
}

.status-in-progress {
  border-left: 3px solid #0ea5e9;
}

.status-review {
  border-left: 3px solid #f59e0b;
}

.status-qa {
  border-left: 3px solid #8b5cf6;
}

.status-done {
  border-left: 3px solid #10b981;
  opacity: 0.7;
}
</style> 