<template>
  <div id="app">
    <div v-if="user">
      <div class="header">
        <div class="header-title" :class="{ 'can-edit': canEditProject }">
          <img src="./assets/kaiborg_logo.png" alt="Kaiborg Logo" class="logo" />
          <h1 @click="canEditProject && openProjectModal(selectedBoard)">
            {{ selectedBoard ? selectedBoard.name : 'Kaiborg' }}
            <svg v-if="canEditProject" xmlns="http://www.w3.org/2000/svg" class="settings-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </h1>
        </div>
        <div class="header-actions">
          <div class="search-container">
            <form @submit.prevent="performSearch" class="search-form">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tasks, @username, or combine both..."
                class="search-input"
                @keyup.enter="performSearch"
              />
              <button type="submit" class="search-btn" :disabled="!searchQuery.trim()">
                <svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
          <button v-if="selectedBoard" @click="handleNewTask" class="action-btn">
            Add Task
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
          </button>
          <button v-if="selectedBoard" @click="toggleChangelog" class="action-btn">
            Changelog
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <user-dropdown
          :user="user"
          :boards="boards"
          :selectedBoardId="selectedBoard?.id"
          :selectedBoard="selectedBoard"
          @select-board="selectBoard"
          @new-project="openNewProjectModal"
          @edit-project="openProjectModal"
          @sign-out="signOut"
        />
      </div>
      <div v-if="selectedBoard">
        <div class="columns">
          <draggable-column 
            v-for="col in computedColumns" 
            :key="col.id"
            :column="col"
            :boardId="selectedBoard.id"
            :emptyMessage="getRandomEmptyMessage()"
            :board-collaborators="(() => { console.log('Board collaboratorDetails:', selectedBoard.collaboratorDetails); return selectedBoard.collaboratorDetails || []; })()"
            :board-categories="(() => { console.log('Board categories:', selectedBoard.categories); return selectedBoard.categories || []; })()"
            @open-task="openTaskModal"
            @task-moved="handleTaskMoved"
            @tasks-reordered="handleTasksReordered"
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
    <changelog-sidesheet
      v-if="showChangelog"
      :done-tasks="doneTasks"
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
import { onBeforeUnmount } from 'vue';
import TaskModal from './components/TaskModal.vue';
import UserDropdown from './components/UserDropdown.vue';
import ProjectModal from './components/ProjectModal.vue';
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
    TaskModal, 
    UserDropdown, 
    ProjectModal, 
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

    return {
      // Auth
      user: auth.user,
      signInWithGoogle: auth.signInWithGoogle,
      signOut: auth.signOut,
      
      // Boards
      boards: boards.boards,
      selectedBoard: boards.selectedBoard,
      canEditProject: boards.canEditCurrentBoard,
      selectBoard: boards.selectBoard,
      createProject: boards.createNewBoard,
      updateProject: boards.updateExistingBoard,
      
      // Tasks
      tasks: tasks.tasks,
      selectedTask: tasks.selectedTask,
      computedColumns: tasks.computedColumns,
      doneTasks: tasks.doneTasks,
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
  background-color: #252531;
  color: #D1D5DB;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1a1a27;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #2d2d3a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 30;
}

.header-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-title.can-edit h1 {
  cursor: pointer;
  transition: color 0.2s ease;
}

.header-title.can-edit h1:hover {
  color: #6366f1;
}

.logo {
  width: 45px;
  height: 45px;
  margin-right: 12px;
  border-radius: 6px;
}

.header-title h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 600;
  color: #f9fafb;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.2;
}

.settings-icon {
  width: 20px;
  height: 20px;
  color: #9CA3AF;
  transition: color 0.2s ease;
}

.header-title.can-edit h1:hover .settings-icon {
  color: #6366f1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  justify-content: center;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-form {
  display: flex;
  align-items: center;
  background-color: #2d2d3a;
  border: 1px solid #3a3a47;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.search-form:focus-within {
  border-color: #6366f1;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  color: #f9fafb;
  font-size: 0.875rem;
  outline: none;
}

.search-input::placeholder {
  color: #9CA3AF;
}

.search-btn {
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover:not(:disabled) {
  color: #6366f1;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-icon {
  width: 18px;
  height: 18px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #1e1e2e;
  color: #a1a1b5;
  border: 1px solid #2d2d3a;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  min-height: 38px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
}

.action-btn:hover {
  background: #252535;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(86, 77, 182, 0.25);
}

.icon {
  width: 18px;
  height: 18px;
  margin-left: 8px;
}

.columns {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1rem;
  gap: 0.5rem;
  background-color: #252531;
  flex: 1;
  height: calc(100vh - 95px); /* Increased subtraction to prevent window scrollbar */
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
