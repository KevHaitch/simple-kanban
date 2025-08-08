/**
 * Search functionality composable
 */
import { ref } from 'vue';
import { filterTasks } from '../utils/searchUtils';

export function useSearch(tasks) {
  const searchQuery = ref('');
  const searchResults = ref([]);
  const showSearchModal = ref(false);
  const isSearching = ref(false);

  /**
   * Perform search based on query
   */
  async function performSearch() {
    if (!searchQuery.value.trim()) {
      return;
    }

    isSearching.value = true;
    
    try {
      const results = await filterTasks(tasks.value, searchQuery.value.trim());
      searchResults.value = results;
      showSearchModal.value = true;
    } catch (error) {
      console.error('Search error:', error);
      searchResults.value = [];
      showSearchModal.value = true;
    } finally {
      isSearching.value = false;
    }
  }

  /**
   * Close search modal
   */
  function closeSearchModal() {
    showSearchModal.value = false;
    searchResults.value = [];
  }

  /**
   * Open task from search results
   */
  function openTaskFromSearch(task, openTaskCallback) {
    closeSearchModal();
    if (openTaskCallback) {
      openTaskCallback(task);
    }
  }

  /**
   * Clear search
   */
  function clearSearch() {
    searchQuery.value = '';
    searchResults.value = [];
    showSearchModal.value = false;
  }

  return {
    searchQuery,
    searchResults,
    showSearchModal,
    isSearching,
    performSearch,
    closeSearchModal,
    openTaskFromSearch,
    clearSearch
  };
}
