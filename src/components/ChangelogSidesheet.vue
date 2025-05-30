<template>
  <div class="sidesheet-overlay" @click.self="$emit('close')">
    <div class="sidesheet">
      <div class="sidesheet-header">
        <h2>Changelog</h2>
        <button @click="$emit('close')" class="close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div class="sidesheet-content">
        <div v-if="doneTasks.length" class="tasks-container">
          <task-card 
            v-for="task in doneTasks" 
            :key="task.id" 
            :task="task" 
            @click="$emit('open-task', task)"
          />
        </div>
        <div v-else class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No completed tasks yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TaskCard from './TaskCard.vue';

export default {
  name: 'ChangelogSidesheet',
  components: {
    TaskCard
  },
  props: {
    doneTasks: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped lang="css">
.sidesheet-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.sidesheet {
  position: absolute;
  top: 0;
  right: 0;
  width: 90%;
  max-width: 600px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #252531;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
  border-left: 1px solid #2d2d3a;
}

.sidesheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background-color: #1a1a27;
  border-bottom: 1px solid #2d2d3a;
  flex-shrink: 0;
}

.sidesheet-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e6e6e9;
  margin: 0;
  font-family: 'Poppins', sans-serif;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6c6c84;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #e6e6e9;
  background-color: rgba(255, 255, 255, 0.05);
}

.close-btn .icon {
  width: 20px;
  height: 20px;
}

.sidesheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scrollbar-width: thin;
  scrollbar-color: #3b3b4a #252531;
}

.sidesheet-content::-webkit-scrollbar {
  width: 6px;
}

.sidesheet-content::-webkit-scrollbar-track {
  background: #252531;
  border-radius: 3px;
}

.sidesheet-content::-webkit-scrollbar-thumb {
  background-color: #3b3b4a;
  border-radius: 3px;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  color: #6c6c84;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  stroke: #6c6c84;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state p {
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
}
</style>