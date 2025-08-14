<template>
  <div class="category-manager">
    <label class="field-label">Categories</label>
    
    <div class="categories-list">
      <div 
        v-for="(category, index) in categories" 
        :key="`category-${index}`"
        class="category-item"
      >
        <input
          v-model="category.name"
          @input="updateCategory(category.id, 'name', $event.target.value, false)"
          @blur="updateCategory(category.id, 'name', $event.target.value, true)"
          class="category-name-input"
          placeholder="Category name"
          :disabled="category.id === 'general'"
        />
        
        <div class="color-picker-container">
          <input
            v-model="category.color"
            @input="updateCategory(category.id, 'color', $event.target.value, false)"
            type="color"
            class="color-picker"
            :title="`Color for ${category.name}`"
          />
          <div 
            class="color-preview"
            :style="{ backgroundColor: category.color }"
          ></div>
        </div>
        
        <button
          v-if="category.id !== 'general'"
          @click="removeCategory(category.id)"
          class="remove-category-btn"
          type="button"
          title="Remove category"
        >
          ×
        </button>
      </div>
    </div>
    
    <button
      @click="addNewCategory"
      type="button"
      class="add-category-btn"
    >
      <svg class="plus-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
      Add Category
    </button>
    
    <div class="help-text">
      Categories help organize your tasks. Each category can have a custom color.
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue';

export default {
  name: 'CategoryManager',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const categories = ref([]);

    // Default category colors
    const defaultColors = [
      '#3b82f6', // Blue
      '#ef4444', // Red  
      '#10b981', // Green
      '#f59e0b', // Amber
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#6b7280', // Gray
    ];

    // Convert old string-based categories to new format
    const convertCategoriesToNewFormat = (inputCategories) => {
      if (!inputCategories || inputCategories.length === 0) {
        return [
          { 
            id: 'general', 
            name: 'General', 
            color: defaultColors[0] 
          }
        ];
      }

      return inputCategories.map((cat, index) => {
        // If it's already in new format (object with id, name, color)
        if (typeof cat === 'object' && cat.id && cat.name && cat.color) {
          return cat;
        }
        
        // Convert from old string format
        const name = typeof cat === 'string' ? cat : cat.name || 'Unnamed';
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const color = cat.color || defaultColors[index % defaultColors.length];
        
        return { id, name, color };
      });
    };

    // Initialize categories from props
    categories.value = convertCategoriesToNewFormat(props.modelValue);

    // Watch for external changes to modelValue
    watch(() => props.modelValue, (newValue) => {
      categories.value = convertCategoriesToNewFormat(newValue);
    });

    // Generate unique ID for new categories
    const generateCategoryId = (name) => {
      const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      let id = baseId;
      let counter = 1;
      
      while (categories.value.some(cat => cat.id === id)) {
        id = `${baseId}-${counter}`;
        counter++;
      }
      
      return id;
    };

    // Add new category
    const addNewCategory = () => {
      const newCategory = {
        id: generateCategoryId('new-category'),
        name: 'New Category',
        color: defaultColors[categories.value.length % defaultColors.length]
      };
      
      categories.value.push(newCategory);
      emitUpdate();
    };

    // Remove category
    const removeCategory = (categoryId) => {
      if (categoryId === 'general') return; // Prevent removing General category
      
      categories.value = categories.value.filter(cat => cat.id !== categoryId);
      emitUpdate();
    };

    // Update category property
    const updateCategory = (categoryId, property, value, shouldUpdateId = true) => {
      const category = categories.value.find(cat => cat.id === categoryId);
      if (category) {
        category[property] = value;
        
        // If changing name, potentially update ID (except for General) - only when shouldUpdateId is true
        if (property === 'name' && categoryId !== 'general' && shouldUpdateId) {
          const newId = generateCategoryId(value);
          if (newId !== categoryId) {
            category.id = newId;
          }
        }
        
        emitUpdate();
      }
    };

    // Emit updates to parent
    const emitUpdate = () => {
      emit('update:modelValue', [...categories.value]);
    };

    // Ensure General category always exists
    watch(categories, (newCategories) => {
      const hasGeneral = newCategories.some(cat => cat.id === 'general');
      if (!hasGeneral) {
        categories.value.unshift({
          id: 'general',
          name: 'General',
          color: defaultColors[0]
        });
        emitUpdate();
      }
    }, { deep: true });

    return {
      categories,
      addNewCategory,
      removeCategory,
      updateCategory
    };
  }
};
</script>

<style scoped>
.category-manager {
  width: 100%;
}

.field-label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #e6e6e9;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.category-name-input {
  flex: 1;
  background-color: transparent;
  border: none;
  color: #e6e6e9;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 4px;
  outline: none;
  transition: background-color 0.2s ease;
}

.category-name-input:focus {
  background-color: rgba(255, 255, 255, 0.1);
}

.category-name-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.color-picker {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  outline: none;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-preview:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.remove-category-btn {
  width: 24px;
  height: 24px;
  border: none;
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-category-btn:hover {
  background-color: #ef4444;
  color: white;
  transform: scale(1.1);
}

.add-category-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  width: fit-content;
}

.add-category-btn:hover {
  background-color: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-1px);
}

.plus-icon {
  width: 14px;
  height: 14px;
}

.help-text {
  margin-top: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.4;
}
</style>

