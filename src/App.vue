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
          <button v-if="selectedBoard" @click="openNewTaskModal" class="action-btn">
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
          @select-board="selectBoard"
          @new-project="openNewProjectModal"
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
import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import TaskModal from './components/TaskModal.vue';
import UserDropdown from './components/UserDropdown.vue';
import ProjectModal from './components/ProjectModal.vue';
import ChangelogSidesheet from './components/ChangelogSidesheet.vue';
import LandingPage from './components/LandingPage.vue';
import DraggableColumn from './components/DraggableColumn.vue';
import AppUpdateNotification from './components/AppUpdateNotification.vue';
import SearchModal from './components/SearchModal.vue';
import userStore from './userStore';

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
  data() {
    return {
      user: null,
      boards: [],
      selectedBoard: null,
      selectedTask: null,
      tasks: [],
      showProjectModal: false,
      projectToEdit: null,
      showChangelog: false,
      showSearchModal: false,
      searchResults: [],
      columnDefs: [
        { id: 'backlog', name: 'Backlog' },
        { id: 'ready', name: 'Ready' },
        { id: 'in-progress', name: 'In Progress' },
        { id: 'review', name: 'Review' },
        { id: 'qa', name: 'QA' },
      ],
      emptyColumnMessages: [
        "This is not the droid you're looking for",
        "Nothing to see here",
        "Get to work",
        "Be formless, shapeless, like water",
        "For fast acting relief, try slowing down",
        "Every moment is a fresh beginning",
        "The universe doesn't allow perfection",
        "Don't let the perfect be the enemy of the good"
      ],
      searchQuery: ''
    };
  },
  computed: {
    computedColumns() {
      return this.columnDefs.map((col) => ({
        ...col,
        tasks: this.tasks.filter((task) => task.status === col.id) || [],
      }));
    },
    doneTasks() {
      return this.tasks
        .filter((task) => task.status === 'done')
        .sort((a, b) => {
          // Convert completedAt to milliseconds for comparison
          const timeA = a.completedAt ? (typeof a.completedAt.toMillis === 'function' ? a.completedAt.toMillis() : a.completedAt.getTime()) : 0;
          const timeB = b.completedAt ? (typeof b.completedAt.toMillis === 'function' ? b.completedAt.toMillis() : b.completedAt.getTime()) : 0;
          // Sort in descending order (most recent first)
          return timeB - timeA;
        }) || [];
    },
    canEditProject() {
      // Only the owner of the project can edit it
      return this.selectedBoard && this.user && this.selectedBoard.owner === this.user.uid;
    }
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      if (user) {
        this.loadBoards();
      } else {
        this.boards = [];
        this.selectedBoard = null;
        this.tasks = [];
      }
    });
  },
  methods: {
    getRandomEmptyMessage() {
      const randomIndex = Math.floor(Math.random() * this.emptyColumnMessages.length);
      return this.emptyColumnMessages[randomIndex];
    },
    signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          this.user = result.user;
          this.loadBoards();
        })
        .catch((error) => alert(error.message));
    },
    signOut() {
      signOut(auth).then(() => {
        this.user = null;
      });
    },
    openProjectModal(project = null) {
      this.projectToEdit = project;
      this.showProjectModal = true;
    },
    closeProjectModal() {
      this.showProjectModal = false;
      this.projectToEdit = null;
    },
    openNewProjectModal() {
      this.openProjectModal();
    },
    async createProject(projectData) {
      if (!projectData.name || !this.user) return;
      
      // Filter out empty emails and make sure emails are unique
      const collaborators = projectData.collaborators
        ? projectData.collaborators
            .filter(email => email && email.includes('@'))
            .filter((email, index, self) => self.indexOf(email) === index)
        : [];
        
      await addDoc(collection(db, 'boards'), {
        name: projectData.name,
        owner: this.user.uid,
        ownerEmail: this.user.email,
        collaborators: collaborators,
        createdAt: new Date(),
      });
      this.closeProjectModal();
    },
    async updateProject(updatedProject) {
      if (!updatedProject.id || !this.user) return;
      
      // Filter out empty emails and make sure emails are unique
      const collaborators = updatedProject.collaborators
        ? updatedProject.collaborators
            .filter(email => email && email.includes('@'))
            .filter((email, index, self) => self.indexOf(email) === index)
        : [];
      
      const projectRef = doc(db, 'boards', updatedProject.id);
      await updateDoc(projectRef, {
        name: updatedProject.name,
        collaborators: collaborators
      });
      
      // Update the selectedBoard locally to immediately reflect the changes
      if (this.selectedBoard && this.selectedBoard.id === updatedProject.id) {
        this.selectedBoard = { 
          ...this.selectedBoard, 
          name: updatedProject.name,
          collaborators: collaborators
        };
      }
      
      // Also update in the boards array
      const boardIndex = this.boards.findIndex(board => board.id === updatedProject.id);
      if (boardIndex !== -1) {
        this.boards[boardIndex].name = updatedProject.name;
        this.boards[boardIndex].collaborators = collaborators;
      }
      
      this.closeProjectModal();
    },
    loadBoards() {
      // Create a query for boards where user is the owner
      const ownerQuery = query(collection(db, 'boards'), where('owner', '==', this.user.uid));
      
      // Fetch boards where user is the owner
      onSnapshot(
        ownerQuery, 
        (ownerSnapshot) => {
          // Map the owner's boards and add isOwner flag
          const ownerBoards = ownerSnapshot.docs.map((doc) => {
            const data = doc.data();
            // Ensure all boards have a collaborators field (for older entries)
            return { 
              id: doc.id, 
              ...data, 
              collaborators: data.collaborators || [],
              isOwner: true 
            };
          });
          
          // Set the boards immediately so owner can see their own projects
          this.boards = ownerBoards;
          
          // Select the first board by default if no board is currently selected
          if (this.boards.length > 0 && !this.selectedBoard) {
            this.selectBoard(this.boards[0]);
          }
          
          // Create a query for boards where user is a collaborator
          if (this.user.email) {
            try {
              const collaboratorQuery = query(
                collection(db, 'boards'), 
                where('collaborators', 'array-contains', this.user.email)
              );
              
              // Fetch boards where user is a collaborator
              onSnapshot(
                collaboratorQuery,
                (collabSnapshot) => {
                  // Only add boards that aren't already in the list (not owned by user)
                  const collabBoards = collabSnapshot.docs
                    .filter(doc => !ownerBoards.some(board => board.id === doc.id))
                    .map((doc) => {
                      const data = doc.data();
                      return { 
                        id: doc.id, 
                        ...data,
                        isOwner: false 
                      };
                    });
                  
                  // Add collaborator boards to the list
                  this.boards = [...ownerBoards, ...collabBoards].sort((a, b) => {
                    // Safe comparison that works even if createdAt is missing or in different formats
                    const timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : a.createdAt) : 0;
                    const timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : b.createdAt) : 0;
                    return timeB - timeA;
                  });
                },
                (error) => {
                  console.log("Note: Collaborator boards could not be loaded. This is expected if you haven't shared any boards yet.");
                  // Don't show error in console as it's expected until rules are properly deployed
                  // console.error("Error fetching collaborator boards:", error);
                }
              );
            } catch (error) {
              console.log("Note: Collaborator boards could not be loaded. This is expected if you haven't shared any boards yet.");
              // Don't show error in console as it's expected until rules are properly deployed
              // console.error("Error setting up collaborator query:", error);
            }
          }
        },
        (error) => {
          console.error("Error fetching owner boards:", error);
          this.boards = [];
        }
      );
    },
    selectBoard(board) {
      this.selectedBoard = board;
      this.loadTasks(board.id);
    },
    async addTask(taskData) {
      if (!this.selectedBoard) return;
      
      // Get all tasks in the target column to calculate the highest order
      const tasksInColumn = this.tasks.filter(t => t.status === (taskData.status || 'backlog'));
      const highestOrder = tasksInColumn.length > 0 
        ? Math.max(...tasksInColumn.map(t => t.order || 0)) 
        : -1;
      
      const newTask = {
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        assignees: taskData.assignees || [],
        status: taskData.status || 'backlog',
        createdAt: new Date(),
        order: highestOrder + 1, // Place new task at the end of the column
      };
      
      // Set completedAt if status is done
      if (taskData.status === 'done') {
        newTask.completedAt = taskData.completedAt || new Date();
      }
      
      const docRef = await addDoc(collection(db, `boards/${this.selectedBoard.id}/tasks`), newTask);
      return docRef.id;
    },
    loadTasks(boardId) {
      const tasksQuery = query(collection(db, `boards/${boardId}/tasks`));
      onSnapshot(
        tasksQuery,
        (snapshot) => {
          this.tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              // First sort by status
              if (a.status !== b.status) {
                return a.status.localeCompare(b.status);
              }
              // Then sort by order within status
              return (a.order || 0) - (b.order || 0);
            });
        },
        (error) => {
          console.error('Error loading tasks:', error);
          this.tasks = [];
        }
      );
    },
    openTaskModal(task) {
      this.selectedTask = {
        ...task,
        assignees: task.assignees || [],
      };
    },
    openNewTaskModal() {
      this.selectedTask = {
        title: '',
        description: '',
        assignees: [],
        status: 'backlog',
        createdAt: new Date(),
      };
    },
    async saveTask(updatedTask) {
      if (!this.selectedBoard) return;
      
      if (updatedTask.id) {
        const taskRef = doc(db, `boards/${this.selectedBoard.id}/tasks`, updatedTask.id);
        const existingTask = this.tasks.find(t => t.id === updatedTask.id);
        
        // Create task data object, preserving all fields
        const taskData = {
          title: updatedTask.title,
          description: updatedTask.description,
          assignees: updatedTask.assignees || [],
          status: updatedTask.status,
          createdAt: existingTask?.createdAt,
          order: existingTask?.order || 0,
          completedAt: updatedTask.status === 'done' ? (updatedTask.completedAt || new Date()) : null
        };
        
        // If status changed, update order to put it at the end of the column
        if (existingTask && existingTask.status !== updatedTask.status) {
          const tasksInTargetColumn = this.tasks.filter(t => t.status === updatedTask.status);
          const highestOrder = tasksInTargetColumn.length > 0 
            ? Math.max(...tasksInTargetColumn.map(t => t.order || 0)) 
            : -1;
          
          taskData.order = highestOrder + 1;
        }
        
        await updateDoc(taskRef, taskData);
        
        // Update local state
        this.tasks = this.tasks.map(t => 
          t.id === updatedTask.id ? { ...t, ...taskData } : t
        );
      } else {
        const newTaskId = await this.addTask(updatedTask);
        this.selectedTask = { ...updatedTask, id: newTaskId };
      }
    },
    closeTaskModal() {
      this.selectedTask = null;
    },
    toggleChangelog() {
      this.showChangelog = !this.showChangelog;
    },
    async deleteTask(task) {
      if (!this.selectedBoard) return;
      const taskRef = doc(db, `boards/${this.selectedBoard.id}/tasks`, task.id);
      await deleteDoc(taskRef);
      this.loadTasks(this.selectedBoard.id);
    },
    async handleTaskMoved({ task, newStatus, oldStatus, newIndex }) {
      if (!this.selectedBoard) return;

      const tasksInTargetColumn = this.tasks.filter(t => t.status === newStatus);
      let newOrder = 0;
      
      if (newIndex === 0) {
        const firstTask = tasksInTargetColumn[0];
        newOrder = firstTask ? (firstTask.order || 0) - 1 : 0;
      } else if (newIndex >= tasksInTargetColumn.length) {
        const lastTask = tasksInTargetColumn[tasksInTargetColumn.length - 1];
        newOrder = lastTask ? (lastTask.order || 0) + 1 : 0;
      } else {
        const taskBefore = tasksInTargetColumn[newIndex - 1];
        const taskAfter = tasksInTargetColumn[newIndex];
        const orderBefore = taskBefore ? (taskBefore.order || 0) : 0;
        const orderAfter = taskAfter ? (taskAfter.order || 0) : 0;
        newOrder = orderBefore + (orderAfter - orderBefore) / 2;
      }

      const taskRef = doc(db, `boards/${this.selectedBoard.id}/tasks`, task.id);
      const taskData = {
        ...task,
        status: newStatus,
        order: newOrder,
        completedAt: newStatus === 'done' ? new Date() : null
      };
      
      await updateDoc(taskRef, taskData);
      
      // Update local state
      this.tasks = this.tasks.map(t => 
        t.id === task.id ? { ...t, ...taskData } : t
      );
    },
    async handleTasksReordered({ columnId, tasks }) {
      if (!this.selectedBoard) return;
      
      const batch = writeBatch(db);
      
      tasks.forEach((task, index) => {
        const taskRef = doc(db, `boards/${this.selectedBoard.id}/tasks`, task.id);
        batch.update(taskRef, { 
          order: index
        });
      });
      
      await batch.commit();
      
      // Update local state to match the new order
      this.tasks = this.tasks.map(task => {
        const updatedTask = tasks.find(t => t.id === task.id);
        if (updatedTask) {
          return { ...task, order: updatedTask.order };
        }
        return task;
      });
    },
    performSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        return;
      }

      const query = this.searchQuery.trim().toLowerCase();
      
      // Parse the search query to extract username and keywords
      const usernameMatch = query.match(/@(\w+)/);
      const username = usernameMatch ? usernameMatch[1] : null;
      
      // Remove the @username part to get the remaining keywords
      const keywords = query.replace(/@\w+/g, '').trim();
      
      this.searchResults = this.tasks.filter(task => {
        let matchesUsername = true;
        let matchesKeywords = true;
        
        // Check username match if @username is present
        if (username) {
          matchesUsername = false;
          if (task.assignees && task.assignees.length > 0) {
            matchesUsername = task.assignees.some(email => {
              const firstName = userStore.getFirstNameFromEmail(email);
              return firstName.toLowerCase().includes(username);
            });
          }
        }
        
        // Check keywords match if keywords are present
        if (keywords) {
          const titleMatch = task.title && task.title.toLowerCase().includes(keywords);
          const descriptionMatch = task.description && task.description.toLowerCase().includes(keywords);
          matchesKeywords = titleMatch || descriptionMatch;
        }
        
        // Both conditions must be true (if they exist)
        return matchesUsername && matchesKeywords;
      });
      
      this.showSearchModal = true;
    },
    closeSearchModal() {
      this.showSearchModal = false;
      this.searchQuery = '';
      this.searchResults = [];
    },
    openTaskFromSearch(task) {
      this.openTaskModal(task);
      this.closeSearchModal();
    },
  },
};
</script>

<style scoped lang="css">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

#app {
  min-height: 100vh;
  background-color: #252531;
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent main scrolling */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #1a1a27;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  flex-shrink: 0; /* Prevent header from shrinking */
}

.header-title {
  display: flex;
  align-items: center;
}

.header-title.can-edit h1 {
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
}

.header-title.can-edit h1:hover {
  color: #F8BD4F;
}

.settings-icon {
  width: 30px;
  height: 30px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #494954;
  transform: translateY(2px);
}

.header-title.can-edit h1:hover .settings-icon {
  opacity: 1;
}

.logo {
  width: 60px;
  height: auto;
  margin-right: 1rem;
}

.header h1 {
  color: #F5A623;
  font-size: 36px;
  line-height: 1.2;
  margin: 0;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 1rem;
  margin-left: auto;
  margin-right: 2rem;
}

.search-container {
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

.search-form {
  display: flex;
  align-items: center;
  background-color: #1e1e2d;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.search-form:focus-within {
  border-color: #564db6;
  box-shadow: 0 0 0 3px rgba(86, 77, 182, 0.25);
}

.search-input {
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #e6e6e9;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
  width: 200px;
  outline: none;
}

.search-input::placeholder {
  color: #6b7280;
}

.search-btn {
  padding: 10px 12px;
  background: transparent;
  color: #9ca3af;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover:not(:disabled) {
  background: #252535;
  color: #e6e6e9;
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
  padding: 10px 18px;
  background: #1e1e2d;
  color: #e6e6e9;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
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
