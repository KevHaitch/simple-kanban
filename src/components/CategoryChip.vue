<template>
  <div 
    class="category-chip"
    :class="{ 'clickable': clickable }"
    :style="{ backgroundColor: categoryColor }"
    @click="handleClick"
  >
    <span class="category-name">{{ categoryName }}</span>
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
/* Standardized category chip - matches AssigneeChip design */
.category-chip {
  display: flex;
  align-items: center;
  height: 26px;
  color: white;
  border-radius: 13px;
  padding: 0 10px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
  margin-right: 4px;
  margin-bottom: 4px;
}

.category-chip.clickable {
  cursor: pointer;
}

.category-chip.clickable:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.category-name {
  line-height: 1;
}
</style>
