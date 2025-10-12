<template>
  <div id="app">
    <div v-if="user">
      <app-header
        :user="user"
        :selected-board="selectedBoard"
        :boards="boards"
        v-model:search-query="searchQuery"
        @select-board="selectBoard"
        @new-project="openNewProjectModal"
        @edit-project="openProjectModal"
        @edit-categories="openCategoriesModal"
        @sign-out="signOut"
        @new-task="handleNewTask"
        @toggle-changelog="toggleChangelog"
        @search="performSearch"
        @open-search-modal="openSearchModal"
      />
      <div v-if="selectedBoard">
        <div class="columns" :class="`layout-${columnLayout}`">
          <draggable-column 
            v-for="col in responsiveColumns" 
            :key="col.id"
            :column="col"
            :selected-backlog-category="selectedBacklogCategory"
            :backlog-category-counts="backlogCategoryCounts"
            :boardId="selectedBoard.id"
            :emptyMessage="getRandomEmptyMessage()"
            :board-collaborators="selectedBoard.collaboratorDetails || []"
            :board-categories="selectedBoard.categories || []"
            :is-combined="col.isCombined || false"
            :combined-columns="col.combinedColumns || []"
            :selected-combined-column="col.id === 'combined' ? selectedCombinedStatus : null"
            :is-mobile-layout="col.isMobileLayout || false"
            :backlog-categories="col.backlogCategories || []"
            :status-columns="col.statusColumns || []"
            @open-task="openTaskModal"
            @task-moved="handleTaskMoved"
            @tasks-reordered="handleTasksReordered"
            @updateBacklogCategory="setBacklogCategory"
            @updateCombinedColumn="setSelectedCombinedStatus"
          />
        </div>
      </div>
      <div v-else class="no-board">
        <p>No board selected. Choose one from the dropdown or create a new project.</p>
      </div>
    </div>
    <landing-page v-else @sign-in="signInWithGoogle" />
    <task-modal
      v-if="selectedTask"
      :key="`task-${selectedTask.id}`"
      :task="selectedTask"
      :boardId="selectedBoard?.id"
      :board-collaborators="selectedBoard?.collaboratorDetails || []"
      :board-categories="selectedBoard?.categories || []"
      :onDelete="deleteTaskHandler"
      @close="closeTaskModal"
      @save="saveTask"
    />
    <project-modal
      v-if="showProjectModal"
      :is-open="showProjectModal"
      :project="projectToEdit"
      @close="closeProjectModal"
      @create="createProject"
      @update="updateProject"
    />
    <categories-modal
      v-if="showCategoriesModal"
      :is-open="showCategoriesModal"
      :project="projectForCategories"
      @updated="(cats) => { if (selectedBoard) selectedBoard.categories = cats }"
      @close="closeCategoriesModal"
    />
    <changelog-sidesheet
      v-if="showChangelog"
      :done-tasks="doneTasks"
      :board-categories="selectedBoard?.categories || []"
      @close="showChangelog = false"
      @open-task="openTaskModal"
    />
    <app-update-notification />
    <search-modal
      v-if="showSearchModal"
      :is-open="showSearchModal"
      :results="searchResults"
      v-model:search-query="searchQuery"
      @close="closeSearchModal"
      @open-task="openTaskFromSearch"
      @search="performSearch"
    />
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount } from 'vue';
import AppHeader from './components/AppHeader.vue';
import TaskModal from './components/TaskModal.vue';
import UserDropdown from './components/UserDropdown.vue';
import ProjectModal from './components/ProjectModal.vue';
import CategoriesModal from './components/CategoriesModal.vue';
import ChangelogSidesheet from './components/ChangelogSidesheet.vue';
import LandingPage from './components/LandingPage.vue';
import DraggableColumn from './components/DraggableColumn.vue';
import AppUpdateNotification from './components/AppUpdateNotification.vue';
import SearchModal from './components/SearchModal.vue';
import { useAuth } from './composables/useAuth';
import { useBoards } from './composables/useBoards';
import { useTasks } from './composables/useTasks';
import { useSearch } from './composables/useSearch';
import { useModals } from './composables/useModals';
import { useBreakpoint } from './composables/useBreakpoint';
import { getRandomEmptyMessage } from './constants/messages';

export default {
  name: 'App',
  components: { 
    AppHeader,
    TaskModal, 
    UserDropdown, 
    ProjectModal, 
    CategoriesModal,
    ChangelogSidesheet, 
    LandingPage,
    DraggableColumn,
    AppUpdateNotification,
    SearchModal
  },
  setup() {
    // Initialize all composables
    const auth = useAuth();
    const boards = useBoards(auth.user);
    const tasks = useTasks(boards.selectedBoard, auth.user);
    const search = useSearch(tasks.tasks);
    const modals = useModals();
    const breakpoint = useBreakpoint();

    // Cleanup on unmount
    onBeforeUnmount(() => {
      boards.cleanup();
      tasks.cleanup();
    });

    function setBacklogCategory(val) {
      // Ensure we update the ref's value, not reassign the ref
      tasks.selectedBacklogCategory.value = val;
    }

    // Track selected combined status for responsive views
    // Default to 'backlog-general' for mobile, 'ready' for others
    const getInitialCombinedStatus = () => {
      return breakpoint.isMobile.value ? 'backlog-general' : 'ready';
    };
    
    const selectedCombinedStatus = ref(getInitialCombinedStatus());

    function setSelectedCombinedStatus(statusId) {
      selectedCombinedStatus.value = statusId;
    }
    
    // Watch for layout changes and update default if needed
    // When switching to mobile for the first time, default to backlog
    let hasSetMobileDefault = false;
    const unwatchLayout = breakpoint.columnLayout.value;
    if (breakpoint.isMobile.value && !hasSetMobileDefault) {
      selectedCombinedStatus.value = 'backlog-general';
      hasSetMobileDefault = true;
    }

    // Compute responsive columns based on breakpoint
    const responsiveColumns = computed(() => {
      const allColumns = tasks.computedColumns.value;
      const layout = breakpoint.columnLayout.value;

      // Desktop Large (≥1200px): Show all 5 columns
      if (layout === 'desktop-large') {
        return allColumns;
      }

      // Desktop Small (992-1199px): 4 columns
      // backlog, combined(ready+in-progress+review), qa, done
      if (layout === 'desktop-small') {
        const backlog = allColumns.find(c => c.id === 'backlog');
        const ready = allColumns.find(c => c.id === 'ready');
        const inProgress = allColumns.find(c => c.id === 'in-progress');
        const review = allColumns.find(c => c.id === 'review');
        const qa = allColumns.find(c => c.id === 'qa');
        const done = allColumns.find(c => c.id === 'done');

        const combined = {
          id: 'combined',
          name: 'Combined',
          isCombined: true,
          combinedColumns: [
            { id: 'ready', name: 'Ready', count: ready?.tasks?.length || 0 },
            { id: 'in-progress', name: 'In Progress', count: inProgress?.tasks?.length || 0 },
            { id: 'review', name: 'Review', count: review?.tasks?.length || 0 }
          ],
          tasks: [ready, inProgress, review]
            .find(c => c?.id === selectedCombinedStatus.value)?.tasks || []
        };

        return [backlog, combined, qa, done].filter(Boolean);
      }

      // Tablet (576-991px): 3 columns
      // backlog, combined(ready+in-progress+review+qa), done
      if (layout === 'tablet') {
        const backlog = allColumns.find(c => c.id === 'backlog');
        const ready = allColumns.find(c => c.id === 'ready');
        const inProgress = allColumns.find(c => c.id === 'in-progress');
        const review = allColumns.find(c => c.id === 'review');
        const qa = allColumns.find(c => c.id === 'qa');
        const done = allColumns.find(c => c.id === 'done');

        const combined = {
          id: 'combined',
          name: 'Combined',
          isCombined: true,
          combinedColumns: [
            { id: 'ready', name: 'Ready', count: ready?.tasks?.length || 0 },
            { id: 'in-progress', name: 'In Progress', count: inProgress?.tasks?.length || 0 },
            { id: 'review', name: 'Review', count: review?.tasks?.length || 0 },
            { id: 'qa', name: 'QA', count: qa?.tasks?.length || 0 }
          ],
          tasks: [ready, inProgress, review, qa]
            .find(c => c?.id === selectedCombinedStatus.value)?.tasks || []
        };

        return [backlog, combined, done].filter(Boolean);
      }

      // Mobile (<576px): 1 column
      // Single combined column with ALL categories and statuses
      if (layout === 'mobile') {
        // Get ALL backlog tasks (not filtered by category like desktop)
        const allBacklogTasks = tasks.tasks.value.filter(t => t.status === 'backlog');
        const ready = allColumns.find(c => c.id === 'ready');
        const inProgress = allColumns.find(c => c.id === 'in-progress');
        const review = allColumns.find(c => c.id === 'review');
        const qa = allColumns.find(c => c.id === 'qa');

        // Build combined columns list including backlog categories
        const boardCats = boards.selectedBoard.value?.categories || [];
        const backlogCounts = tasks.backlogCategoryCounts.value || {};
        
        // Build backlog categories list
        const backlogCategories = [];
        
        // Add General category (counts are keyed by ID, not name)
        backlogCategories.push({
          id: 'backlog-general',
          name: 'General',
          count: backlogCounts['general'] || 0,
          isBacklog: true,
          categoryId: 'general',
          categoryName: 'General'
        });
        
        // Add other categories (counts are keyed by ID, not name)
        boardCats.forEach(cat => {
          if (cat.name.toLowerCase() !== 'general') {
            backlogCategories.push({
              id: `backlog-${cat.id}`,
              name: cat.name,
              count: backlogCounts[cat.id] || 0,
              isBacklog: true,
              categoryId: cat.id,
              categoryName: cat.name
            });
          }
        });
        
        // Build status columns list (without Done - that's in Changelog)
        const statusColumns = [
          { id: 'ready', name: 'Ready', count: ready?.tasks?.length || 0 },
          { id: 'in-progress', name: 'In Progress', count: inProgress?.tasks?.length || 0 },
          { id: 'review', name: 'Review', count: review?.tasks?.length || 0 },
          { id: 'qa', name: 'QA', count: qa?.tasks?.length || 0 }
        ];

        // Get tasks for selected column
        let selectedTasks = [];
        const selectedBacklogCol = backlogCategories.find(c => 
          c.id === selectedCombinedStatus.value
        );
        const selectedStatusCol = statusColumns.find(c => 
          c.id === selectedCombinedStatus.value
        );
        
        if (selectedBacklogCol) {
          // Show backlog tasks for selected category - filter by categoryId
          const categoryId = selectedBacklogCol.categoryId.toLowerCase();
          const categoryName = selectedBacklogCol.categoryName.toLowerCase();
          selectedTasks = allBacklogTasks.filter(task => {
            // Check both categoryId and category name for flexibility
            const taskCatId = (task.categoryId || '').toLowerCase();
            const taskCatName = (task.category || task.categoryName || 'General').toLowerCase();
            return taskCatId === categoryId || taskCatName === categoryName;
          });
        } else if (selectedStatusCol) {
          // Show tasks for selected status
          selectedTasks = [ready, inProgress, review, qa]
            .find(c => c?.id === selectedCombinedStatus.value)?.tasks || [];
        }

        const combined = {
          id: 'combined',
          name: 'All Tasks',
          isCombined: true,
          isMobileLayout: true, // Flag to use two-column layout
          backlogCategories,
          statusColumns,
          tasks: selectedTasks
        };

        return [combined];
      }

      return allColumns;
    });

    // Removed backfill console exposure for security

    const showCategoriesModal = ref(false);
    const projectForCategories = ref(null);

    function openCategoriesModal(project) {
      projectForCategories.value = project || boards.selectedBoard.value;
      showCategoriesModal.value = true;
    }
    function closeCategoriesModal() { showCategoriesModal.value = false; }

    return {
      // Auth
      user: auth.user,
      signInWithGoogle: auth.signInWithGoogle,
      signOut: auth.signOut,
      
      // Boards
      boards: boards.boards,
      selectedBoard: boards.selectedBoard,
      selectBoard: boards.selectBoard,
      createProject: boards.createNewBoard,
      updateProject: boards.updateExistingBoard,
      
      // Tasks
      tasks: tasks.tasks,
      selectedTask: tasks.selectedTask,
      computedColumns: tasks.computedColumns,
      doneTasks: tasks.doneTasks,
      backlogCategoryCounts: tasks.backlogCategoryCounts,
      selectedBacklogCategory: tasks.selectedBacklogCategory,
      setBacklogCategory,
      openTaskModal: tasks.openTaskModal,
      openNewTaskModal: tasks.openNewTaskModal,
      handleNewTask: async () => {
        try {
          await tasks.openNewTaskModal();
        } catch (error) {
          console.error('Error creating new task:', error);
        }
      },
      closeTaskModal: tasks.closeTaskModal,
      saveTask: tasks.saveTask,
      deleteTask: tasks.deleteTask,
      deleteTaskHandler: async (taskId) => {
        try {
          await tasks.deleteTask(taskId);
          tasks.closeTaskModal();
        } catch (error) {
          console.error('App.vue: Delete failed:', error);
        }
      },
      handleTaskMoved: tasks.handleTaskMoved,
      handleTasksReordered: tasks.handleTasksReordered,
      
      // Responsive layout
      columnLayout: breakpoint.columnLayout,
      responsiveColumns,
      selectedCombinedStatus,
      setSelectedCombinedStatus,
      
      // Search
      searchQuery: search.searchQuery,
      searchResults: search.searchResults,
      showSearchModal: search.showSearchModal,
      performSearch: search.performSearch,
      openSearchModal: search.openSearchModal,
      closeSearchModal: search.closeSearchModal,
      openTaskFromSearch: (task) => search.openTaskFromSearch(task, tasks.openTaskModal),
      
      // Modals
      showProjectModal: modals.showProjectModal,
      projectToEdit: modals.projectToEdit,
      showChangelog: modals.showChangelog,
      openProjectModal: modals.openProjectModal,
      closeProjectModal: modals.closeProjectModal,
      openNewProjectModal: modals.openNewProjectModal,
      toggleChangelog: modals.toggleChangelog,
      showCategoriesModal,
      projectForCategories,
      openCategoriesModal,
      closeCategoriesModal,
      
      // Utilities
      getRandomEmptyMessage
    };
  }
};
</script>

<style scoped lang="css">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

#app {
  min-height: 100vh;
  background-color: #000;
  color: #D1D5DB;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
}



.columns {
  display: flex;
  padding: 1.5rem 1.5rem;
  flex: 1;
  height: calc(100vh - 80px);
  overflow: hidden; /* Prevent container scrolling */
  gap: 1rem; /* Default gap for multi-column layouts */
}

.columns .column {
  flex: 1;
  min-width: 0; /* Allow flex items to shrink below content size */
}

/* Mobile layout (<576px) - 1 column - no gap needed */
.columns.layout-mobile {
  gap: 0;
  padding: 0.75rem;
  justify-content: center;
}

.columns.layout-mobile .column {
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.no-board {
  text-align: center;
  padding: 2rem;
  font-size: 1.25rem;
  line-height: 1.75rem;
  color: #D1D5DB;
}
</style>
