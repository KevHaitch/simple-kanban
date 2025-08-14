<template>
  
  <div class="column">
    <div class="column-header">
      <template v-if="column.id === 'backlog'">
        <div class="category-header">
          <CategorySelect
            :categories="boardCategories"
            :counts="countsById"
            v-model="selectedCategoryProxy"
            variant="header"
            :align-left-padding="'1.5rem'"
          />
        </div>
      </template>
      <template v-else>
        <h3>{{ column.name }} ({{ column.tasks.length }})</h3>
      </template>
    </div>
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
              :board-collaborators="boardCollaborators"
              :board-categories="boardCategories"
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
import CategorySelect from './CategorySelect.vue';

export default {
  name: 'DraggableColumn',
  components: {
    draggable,
    TaskCard,
    CategorySelect
  },
  props: {
    column: {
      type: Object,
      required: true
    },
    selectedBacklogCategory: {
      type: String,
      default: 'General'
    },
    backlogCategoryCounts: {
      type: Object,
      default: () => ({})
    },
    boardId: {
      type: String,
      required: true
    },
    emptyMessage: {
      type: String,
      default: 'No tasks yet'
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
  emits: ['openTask', 'taskMoved', 'tasksReordered', 'updateBacklogCategory'],
  setup(props, { emit }) {
    const { column, selectedBacklogCategory } = toRefs(props);
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
            reorderedTasks: value.map((task, index) => ({
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
          newOrder: newIndex
        });
      }
      
      // Handle removed task (moved to another column)
      // We don't need to handle this as the receiving column will emit taskMoved
    };
    
    const selectedCategoryProxy = computed({
      get: () => selectedBacklogCategory.value,
      set: (val) => emit('updateBacklogCategory', val || 'General')
    });

    // Map counts keyed by id to names so CategorySelect header label works per option
    const countsById = computed(() => {
      const out = {};
      const counts = props.backlogCategoryCounts || {};
      const cats = props.boardCategories || [];
      cats.forEach(c => { out[c.name] = counts[c.id] || 0; });
      // Ensure General present
      if ('general' in counts && !('General' in out)) out['General'] = counts['general'];
      return out;
    });

    // Build select options from provided counts and board categories order
    const categoryOptions = computed(() => {
      const counts = props.backlogCategoryCounts || {};
      const boardCats = Array.isArray(props.boardCategories) ? props.boardCategories.map(c => c.name) : [];
      const set = new Set();
      const opts = [];
      if (counts.General !== undefined) {
        opts.push({ name: 'General', count: counts.General });
        set.add('general');
      }
      boardCats.forEach((n) => {
        const key = String(n || '').trim().toLowerCase();
        if (set.has(key)) return;
        opts.push({ name: n, count: counts[n] || 0 });
        set.add(key);
      });
      Object.keys(counts).forEach((n) => {
        const key = String(n || '').trim().toLowerCase();
        if (set.has(key)) return;
        opts.push({ name: n, count: counts[n] || 0 });
        set.add(key);
      });
      return opts;
    });

    return {
      columnTasks,
      onDragEnd,
      onChange,
      onMove,
      onDragStart,
      isDraggingOver,
      selectedBacklogCategory,
      selectedCategoryProxy,
      categoryOptions,
      backlogCategoryCounts: props.backlogCategoryCounts,
      countsById
    };
  }
};
</script>

<style scoped>
.column {
  width: 19%;
  color: #e6e6e9;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; /* Ensure no column overflow */
}

.column-header {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.column h3 {
  font-size: 1rem;
  line-height: 1.5rem;
  color: #6c6c84;
  text-align: left;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  margin: 0.5rem 1.5rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 1.5rem;
  position: relative; /* Anchor menu positioning */
}

.category-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.category-title {
  font-size: 1rem;
  line-height: 1.5rem;
  color: #6c6c84;
  font-weight: 600;
  transition: color 0.15s ease;
}

.category-button:hover .category-title {
  color: #e6e6e9;
}

.category-caret {
  width: 16px;
  height: 16px;
  color: #6c6c84;
  transition: transform 0.2s ease, color 0.15s ease;
}

.category-button:hover .category-caret {
  color: #e6e6e9;
}

.category-caret.open {
  transform: rotate(180deg);
}

.category-menu {
  position: absolute;
  top: calc(100% + 6px); /* sits just below the header/button */
  /* align option text left edge with header text by subtracting menu + item padding */
  left: calc(1.5rem - (6px + 10px));
  min-width: 220px;
  background: #111217;
  border: 1px solid #18181c;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.4);
  padding: 6px;
  z-index: 10;
}

.category-menu-item {
  padding: 8px 10px;
  color: #6c6c84;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.category-menu-item:hover {
  background: rgba(255,255,255,0.06);
  color: #e6e6e9;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto; /* Only scroll when needed */
  overflow-x: hidden; /* No horizontal scroll */
  flex-grow: 1;
  padding: 0 8px;
  scrollbar-width: thin;
  scrollbar-color: #3b3b4a rgba(255, 255, 255, 0.025);
  border-radius:4px;
  /* Subtle glass panel effect */
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* Scrollbar styling for Webkit browsers */
.task-list::-webkit-scrollbar {
  width: 6px;
}

.task-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.025);
  border-radius: 3px;
}

.task-list::-webkit-scrollbar-thumb {
  background-color: #3b3b4a;
  border-radius: 3px;
}

.draggable-container {
  min-height: 10px; /* Ensure the container is always visible */
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px 1rem;
  text-align: center;
  color: #6c6c84;
  font-size: 0.9rem;
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