<template>
  <div class="column">
    <h3>{{ column.name }} ({{ column.tasks.length }})</h3>
    <div class="task-list">
      <draggable 
        v-model="columnTasks" 
        :group="{ name: 'tasks', pull: true, put: true }"
        item-key="id"
        animation="150"
        ghost-class="ghost-card"
        chosen-class="chosen"
        drag-class="dragging"
        :delay="200"
        :delayOnTouchOnly="true"
        @end="onDragEnd"
        @change="onChange"
        @move="onMove"
        @start="onDragStart"
        class="draggable-container"
      >
        <template #item="{ element }">
          <div class="task-card-wrapper">
            <task-card 
              :task="element" 
              :boardId="boardId"
              @click="$emit('openTask', element)" 
              class="draggable-task-card"
            />
          </div>
        </template>
        <template #footer>
          <div v-if="column.tasks.length === 0 && !isDraggingOver" class="empty-column">
            {{ emptyMessage }}
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script>
import { computed, toRefs, ref, onMounted } from 'vue';
import draggable from 'vuedraggable';
import TaskCard from './TaskCard.vue';
import { styleGhostElements, resetTaskStyling, addGlobalDragStyles } from '../utils/dragUtils';

export default {
  name: 'DraggableColumn',
  components: {
    draggable,
    TaskCard
  },
  props: {
    column: {
      type: Object,
      required: true
    },
    boardId: {
      type: String,
      required: true
    },
    emptyMessage: {
      type: String,
      default: 'No tasks yet'
    }
  },
  emits: ['openTask', 'taskMoved', 'tasksReordered'],
  setup(props, { emit }) {
    const { column } = toRefs(props);
    const isDraggingOver = ref(false);
    const isDragging = ref(false);
    
    // Add global styles to ensure consistent placeholder appearance
    onMounted(() => {
      addGlobalDragStyles();
    });
    
    // Capture original dimensions on drag start
    const onDragStart = (event) => {
      isDragging.value = true;
      
      // First, let's store the original dimensions of the dragged element
      if (event.item) {
        const rect = event.item.getBoundingClientRect();
        event.item.dataset.originalWidth = rect.width + 'px';
        event.item.dataset.originalHeight = rect.height + 'px';
      }
      
      // Now style all ghost elements
      styleGhostElements();
    };
    
    // Computed property for the tasks in this column
    const columnTasks = computed({
      get: () => column.value.tasks,
      set: (value) => {
        // Only emit if we're reordering within the same column
        if (value.length === column.value.tasks.length) {
          // Update the local state immediately to prevent jumping back
          column.value.tasks = [...value];
          
          // Emit the reorder event with the updated tasks
          emit('tasksReordered', {
            columnId: column.value.id,
            tasks: value.map((task, index) => ({
              ...task,
              order: index
            }))
          });
        }
      }
    });
    
    // Track when an item is being dragged over this column
    const onMove = (event) => {
      // Check if the drag is happening over this column
      if (event.to && event.to.parentElement && 
          event.to.parentElement.parentElement === event.originalEvent.currentTarget.parentElement) {
        isDraggingOver.value = true;
        // Keep consistent styling while dragging
        if (isDragging.value) {
          styleGhostElements();
        }
      } else {
        isDraggingOver.value = false;
      }
    };
    
    // Handle the end of a drag operation
    const onDragEnd = (event) => {
      // Reset states
      isDraggingOver.value = false;
      isDragging.value = false;
      
      // Clean up any DOM manipulations
      resetTaskStyling();
      
      // Only emit if the column changed
      if (event.from !== event.to) {
        // We don't need to do anything here as onChange will be called
      }
    };
    
    // Handle any change in the draggable (add or remove)
    const onChange = (event) => {
      // Reset dragging over state
      isDraggingOver.value = false;
      isDragging.value = false;
      
      // Clean up any DOM manipulations
      resetTaskStyling();
      
      // Handle added task (coming from another column)
      if (event.added) {
        const task = event.added.element;
        const newStatus = column.value.id;
        const newIndex = event.added.newIndex;
        
        emit('taskMoved', {
          task,
          newStatus,
          oldStatus: task.status,
          newIndex
        });
      }
      
      // Handle removed task (moved to another column)
      // We don't need to handle this as the receiving column will emit taskMoved
    };
    
    return {
      columnTasks,
      onDragEnd,
      onChange,
      onMove,
      onDragStart,
      isDraggingOver
    };
  }
};
</script>

<style scoped>
.column {
  width: 19%;
  background-color: #252531; /* Same as parent background */
  color: #e6e6e9;
  border-radius: 8px;
  padding: 0.25rem;
  box-shadow: inset 2px 2px 5px #1c1c25, 
              inset -2px -2px 5px #30303e,
              2px 0 3px -2px #1c1c25,
              -2px 0 3px -2px #30303e;
  border: none;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; /* Ensure no column overflow */
}

.column h3 {
  font-size: 1rem;
  line-height: 1.5rem;
  color: #e6e6e9;
  text-align: left;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  padding: 1rem;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto; /* Only scroll when needed */
  overflow-x: hidden; /* No horizontal scroll */
  flex-grow: 1;
  /* Scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: #3b3b4a #252531;
}

/* Scrollbar styling for Webkit browsers */
.task-list::-webkit-scrollbar {
  width: 6px;
}

.task-list::-webkit-scrollbar-track {
  background: #252531;
  border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb {
  background-color: #3b3b4a;
  border-radius: 3px;
}

.draggable-container {
  min-height: 10px; /* Ensure the container is always visible */
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px 1rem;
  text-align: center;
  color: #6c6c84;
  font-size: 0.9rem;
  margin: 0.5rem;
  margin-top: 0;
  border: 1px dashed #3b3b4a;
  border-radius: 6px;
  background-color: rgba(30, 30, 45, 0.3);
  min-height: 52px; /* Approximates the height of a one-line card */
  box-sizing: border-box;
  pointer-events: none; /* Ensures dragging works even over this element */
}

.task-card-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 0.25rem;
}

.draggable-task-card {
  width: 100%;
  cursor: pointer;
  touch-action: none; /* Important for mobile drag and drop */
}

/* Initial selection doesn't have rotation */
.chosen {
  cursor: grabbing;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  z-index: 10;
  background-color: #212130 !important;
  border-color: #474756 !important;
}

/* After delay, during actual dragging, apply rotation */
.dragging {
  transform: rotate(-5deg) !important; /* Reduced rotation to 5 degrees */
  cursor: grabbing;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  z-index: 10;
  background-color: #212130 !important;
  border-color: #474756 !important;
}

/* Preserve dimensions of the original card */
.ghost-card {
  opacity: 1 !important;
  background-color: transparent !important;
  border: 2px dashed #6c6c84 !important;
  border-radius: 6px !important;
  box-shadow: none !important;
  transform: none !important;
  /* Remove fixed height and width to allow matching the original card */
  box-sizing: border-box;
}

.ghost-card * {
  visibility: hidden !important;
  opacity: 0 !important;
}

@media (hover: hover) {
  .draggable-task-card:active {
    cursor: grabbing;
  }
}
</style> 