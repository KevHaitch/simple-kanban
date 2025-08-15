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
      />
      <div v-if="selectedBoard">
        <div class="columns">
          <draggable-column 
            v-for="col in computedColumns" 
            :key="col.id"
            :column="col"
            :selected-backlog-category="selectedBacklogCategory"
            :backlog-category-counts="backlogCategoryCounts"
            :boardId="selectedBoard.id"
            :emptyMessage="getRandomEmptyMessage()"
            :board-collaborators="selectedBoard.collaboratorDetails || []"
            :board-categories="selectedBoard.categories || []"
            @open-task="openTaskModal"
            @task-moved="handleTaskMoved"
            @tasks-reordered="handleTasksReordered"
            @updateBacklogCategory="setBacklogCategory"
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
      @close="closeTaskModal"
      @save="saveTask"
      @delete="deleteTask"
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
      :search-query="searchQuery"
      @close="closeSearchModal"
      @open-task="openTaskFromSearch"
    />
  </div>
</template>

<script>
import { ref, onBeforeUnmount } from 'vue';
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

    // Cleanup on unmount
    onBeforeUnmount(() => {
      boards.cleanup();
      tasks.cleanup();
    });

    function setBacklogCategory(val) {
      // Ensure we update the ref's value, not reassign the ref
      tasks.selectedBacklogCategory.value = val;
    }

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
      handleTaskMoved: tasks.handleTaskMoved,
      handleTasksReordered: tasks.handleTasksReordered,
      
      // Search
      searchQuery: search.searchQuery,
      searchResults: search.searchResults,
      showSearchModal: search.showSearchModal,
      performSearch: search.performSearch,
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
  justify-content: space-between;
  padding: 1.5rem 1.5rem;
  gap: 0.125rem;
  flex: 1;
  height: calc(100vh - 80px);
  overflow: hidden; /* Prevent container scrolling */
}

.no-board {
  text-align: center;
  padding: 2rem;
  font-size: 1.25rem;
  line-height: 1.75rem;
  color: #D1D5DB;
}
</style>
