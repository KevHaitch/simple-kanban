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
        :projectId="boardId"
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
    },
    boardId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const isDragging = ref(false);
    
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
    
    return {
      isDragging,
      onDragStart,
      onDragEnd,
      truncateDescription
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

.task-description {
  font-size: 0.8rem;
  color: #a1a1b5;
  margin-bottom: 12px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.assignees-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
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