<template>
  <div 
    class="category-chip"
    :class="{ 'clickable': clickable }"
    :style="{ backgroundColor: categoryColor }"
    @click="handleClick"
  >
    <span class="category-name">{{ categoryName }}</span>
    <svg v-if="clickable" class="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'CategoryChip',
  props: {
    category: {
      type: [String, Object],
      default: 'General'
    },
    clickable: {
      type: Boolean,
      default: false
    },
    boardCategories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const handleClick = () => {
      if (props.clickable) {
        emit('click');
      }
    };

    // Computed properties for category data
    const categoryData = computed(() => {
      // Handle both old string format and new object format
      if (typeof props.category === 'object' && props.category !== null) {
        return props.category;
      }
      
      // Handle string format - try to find in boardCategories or use default
      const categoryName = props.category || 'General';
      const foundCategory = props.boardCategories.find(cat => 
        cat.name === categoryName || cat.id === categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      );
      
      if (foundCategory) {
        return foundCategory;
      }
      
      // Default fallback
      return {
        id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: categoryName,
        color: '#3b82f6' // Default blue
      };
    });

    const categoryName = computed(() => categoryData.value.name);
    const categoryColor = computed(() => categoryData.value.color);

    return {
      handleClick,
      categoryName,
      categoryColor
    };
  }
};
</script>

<style scoped>
.category-chip {
  display: flex;
  align-items: center;
  height: 26px;
  color: white;
  border-radius: 13px;
  padding: 0 10px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  gap: 4px;
  transition: all 0.2s ease;
}

.category-chip.clickable {
  cursor: pointer;
  padding-right: 8px;
}

.category-chip.clickable:hover {
  filter: brightness(0.85);
  transform: translateY(-1px);
}

.category-name {
  line-height: 1;
}

.dropdown-icon {
  width: 12px;
  height: 12px;
  margin-left: 2px;
  transition: transform 0.2s ease;
}

.category-chip.clickable:hover .dropdown-icon {
  transform: translateY(1px);
}
</style>
