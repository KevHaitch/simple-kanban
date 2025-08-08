/**
 * Modal state management composable
 */
import { ref } from 'vue';

export function useModals() {
  // Project modal state
  const showProjectModal = ref(false);
  const projectToEdit = ref(null);
  
  // Changelog state
  const showChangelog = ref(false);

  /**
   * Open project modal for editing or creating
   */
  function openProjectModal(project = null) {
    projectToEdit.value = project;
    showProjectModal.value = true;
  }

  /**
   * Close project modal
   */
  function closeProjectModal() {
    showProjectModal.value = false;
    projectToEdit.value = null;
  }

  /**
   * Open new project modal
   */
  function openNewProjectModal() {
    openProjectModal();
  }

  /**
   * Toggle changelog visibility
   */
  function toggleChangelog() {
    showChangelog.value = !showChangelog.value;
  }

  /**
   * Close changelog
   */
  function closeChangelog() {
    showChangelog.value = false;
  }

  return {
    // Project modal
    showProjectModal,
    projectToEdit,
    openProjectModal,
    closeProjectModal,
    openNewProjectModal,
    
    // Changelog
    showChangelog,
    toggleChangelog,
    closeChangelog
  };
}
