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
      <assignee-chip
        v-for="email in task.assignees" 
        :key="email"
        :email="email"
        :removable="false"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import AssigneeChip from './AssigneeChip.vue';

export default {
  name: 'TaskCard',
  components: {
    AssigneeChip
  },
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

/* Only keep the done status styling */
.status-done {
  opacity: 0.7;
}
</style> 