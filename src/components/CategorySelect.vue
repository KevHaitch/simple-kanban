<template>
  <div class="category-select" :class="variant">
    <template v-if="variant === 'header'">
      <button ref="buttonRef" class="cs-button" @click.stop="toggleMenu">
        <span class="cs-title">{{ displayLabel }}</span>
        <svg class="cs-caret" viewBox="0 0 20 20" fill="currentColor" :class="{ open: open }">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <div v-if="open" class="cs-menu" :style="menuStyle">
        <div
          v-for="opt in optionsWithCounts"
          :key="optKey(opt)"
          class="cs-menu-item"
          @click.stop="select(opt)"
        >
          {{ opt.name }} ({{ opt.count }})
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'grid'">
      <div class="cs-grid">
        <div
          v-for="cat in normalized"
          :key="optKey(cat)"
          class="cs-grid-item"
          :class="{ selected: isSelected(cat) }"
          :style="{ backgroundColor: cat.color }"
          @click.stop="select(cat)"
        >
          <span class="cs-grid-name">{{ cat.name }}</span>
          <div v-if="isSelected(cat)" class="cs-grid-check">
            <svg class="cs-check-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { normalizeCategories, categoryEquals, mergeCategoriesWithCounts } from '../composables/useCategories';

export default {
  name: 'CategorySelect',
  props: {
    categories: { type: Array, default: () => [] },
    counts: { type: Object, default: () => ({}) },
    modelValue: { type: [String, Object], default: 'General' },
    variant: { type: String, default: 'header' }, // 'header' | 'grid'
    preferId: { type: Boolean, default: false },
    alignLeftPadding: { type: String, default: '1.5rem' },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const open = ref(false);
    const buttonRef = ref(null);

    const normalized = computed(() => normalizeCategories(props.categories));
    const optionsWithCounts = computed(() => mergeCategoriesWithCounts(props.categories, props.counts));

    const current = computed(() => {
      const key = typeof props.modelValue === 'object' ? (props.modelValue.id || props.modelValue.name) : props.modelValue;
      const match = normalized.value.find((c) => categoryEquals(c.id, key) || categoryEquals(c.name, key));
      return match || { id: 'general', name: 'General', color: '#3b82f6' };
    });

    const displayLabel = computed(() => {
      const name = current.value.name;
      const count = props.counts && props.counts[name] ? props.counts[name] : 0;
      return props.variant === 'header' ? `${name} (${count})` : name;
    });

    const menuStyle = computed(() => ({ left: `calc(${props.alignLeftPadding} - (6px + 10px))` }));

    function toggleMenu() { open.value = !open.value; }
    function closeMenu() { open.value = false; }
    function onDocClick(e) {
      if (!buttonRef.value) return;
      if (!buttonRef.value.contains(e.target)) closeMenu();
    }
    onMounted(() => document.addEventListener('click', onDocClick));
    onBeforeUnmount(() => document.removeEventListener('click', onDocClick));

    function optKey(opt) { return opt.id || opt.name; }
    function isSelected(cat) { return categoryEquals(cat.id, current.value.id) || categoryEquals(cat.name, current.value.name); }
    function select(opt) {
      const value = props.preferId ? (opt.id || opt.name) : (opt.name || opt.id);
      emit('update:modelValue', value);
      emit('change', value);
      closeMenu();
    }

    return { open, buttonRef, normalized, optionsWithCounts, current, displayLabel, menuStyle, toggleMenu, select, optKey, isSelected };
  }
};
</script>

<style scoped>
.category-select.header .cs-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}
.category-select.header .cs-title {
  font-size: 1rem;
  line-height: 1.5rem;
  color: #6c6c84;
  font-weight: 600;
  transition: color 0.15s ease;
}
.category-select.header .cs-button:hover .cs-title { color: #e6e6e9; }
.category-select.header .cs-caret { width: 16px; height: 16px; color: #6c6c84; transition: transform 0.2s ease, color 0.15s ease; }
.category-select.header .cs-button:hover .cs-caret { color: #e6e6e9; }
.category-select.header .cs-caret.open { transform: rotate(180deg); }
.category-select.header .cs-menu {
  position: absolute;
  top: calc(100% + 6px);
  min-width: 220px;
  background: #111217;
  border: 1px solid #18181c;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.4);
  padding: 6px;
  z-index: 10;
}
.category-select.header .cs-menu-item { padding: 8px 10px; color: #6c6c84; font-weight: 600; font-size: 1rem; border-radius: 6px; cursor: pointer; }
.category-select.header .cs-menu-item:hover { background: rgba(255,255,255,0.06); color: #e6e6e9; }

.category-select.grid .cs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 200px; overflow-y: auto; padding-top: 2px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.3) transparent; }
.category-select.grid .cs-grid::-webkit-scrollbar { width: 6px; }
.category-select.grid .cs-grid::-webkit-scrollbar-track { background: transparent; }
.category-select.grid .cs-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 3px; }
.category-select.grid .cs-grid-item { width: 100px; height: 26px; border-radius: 13px; position: relative; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; }
.category-select.grid .cs-grid-item:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); filter: brightness(1.1); }
.category-select.grid .cs-grid-name { font-size: 0.75rem; font-weight: 500; color: rgba(255,255,255,0.95); text-shadow: 0 1px 2px rgba(0,0,0,0.3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; text-align: left; }
.category-select.grid .cs-grid-check { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.category-select.grid .cs-check-icon { width: 12px; height: 12px; color: rgba(255,255,255,0.95); }
</style>


