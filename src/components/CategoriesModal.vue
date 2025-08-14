<template>
  <div v-if="isOpen" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]" @click.self="$emit('close')"></div>
    <div class="modal-panel z-[1001] relative">
      <div class="modal-header">
        <h2>Categories</h2>
        <button class="icon-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <CategoryManager v-model="localCategories" />
      </div>
      <div class="modal-footer">
        <button class="btn ghost" @click="$emit('close')">Cancel</button>
        <button class="btn primary" :disabled="saving" @click="saveCategories">{{ saving ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import CategoryManager from './CategoryManager.vue';
import { updateBoard } from '../services/boardService';

export default {
  name: 'CategoriesModal',
  components: { CategoryManager },
  props: {
    isOpen: { type: Boolean, default: false },
    project: { type: Object, default: null },
  },
  setup(props, { emit }) {
    const localCategories = ref([]);
    const saving = ref(false);

    watch(() => props.project, (p) => {
      localCategories.value = Array.isArray(p?.categories) ? [...p.categories] : [];
    }, { immediate: true });

    async function saveCategories() {
      if (!props.project?.id) return;
      try {
        saving.value = true;
        await updateBoard(props.project.id, { categories: [...localCategories.value] });
        emit('updated', [...localCategories.value]);
        emit('close');
      } finally {
        saving.value = false;
      }
    }

    return { localCategories, saving, saveCategories };
  }
};
</script>

<style scoped>
.modal-panel {
  max-width: 640px;
  width: 100%;
  background: #1a1a27;
  border: 1px solid #2d2d3a;
  border-radius: 12px;
  color: #e6e6e9;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.3), 0 10px 10px -5px rgba(0,0,0,.2);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #2d2d3a;
}
.modal-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0; }
.icon-btn {
  background: transparent; border: none; color: #a1a1b5; cursor: pointer; font-size: 1.25rem; width: 32px; height: 32px;
}
.modal-body { padding: 1rem 1.25rem; }
.modal-footer { padding: 0.75rem 1.25rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #2d2d3a; }
.btn { padding: 0.5rem 0.9rem; border-radius: 8px; border: 1px solid #2d2d3a; background: #252535; color: #e6e6e9; cursor: pointer; }
.btn.ghost { background: transparent; }
.btn.primary { background: #3b82f6; border-color: #3b82f6; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
</style>


