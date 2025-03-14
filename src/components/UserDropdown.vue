<template>
  <div class="user-dropdown">
    <Menu as="div" class="relative inline-block text-left">
      <div>
        <MenuButton class="user-btn">
          {{ user.displayName || 'User' }}
        </MenuButton>
      </div>

      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems class="dropdown-menu">
          <div v-if="boards.length">
            <MenuItem v-for="board in boards" :key="board.id" v-slot="{ active }">
              <a 
                @click="selectBoard(board)" 
                :class="[
                  active ? 'menu-item-active' : '',
                  'dropdown-item'
                ]"
              >
                <div class="board-name-container">
                  {{ board.name }}
                  <span v-if="!board.isOwner" class="collaborator-badge">Shared</span>
                </div>
                <svg v-if="selectedBoardId === board.id" xmlns="http://www.w3.org/2000/svg" class="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </a>
            </MenuItem>
          </div>
          <div v-else>
            <MenuItem v-slot="{ active }">
              <span 
                :class="[
                  active ? 'menu-item-active' : '',
                  'dropdown-item'
                ]"
              >
                No projects yet
              </span>
            </MenuItem>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <MenuItem v-slot="{ active }">
            <a 
              @click="$emit('new-project')"
              :class="[
                active ? 'menu-item-active' : '',
                'dropdown-item'
              ]"
            >
              New Project
              <svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </a>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <a 
              @click="$emit('sign-out')"
              :class="[
                active ? 'menu-item-active' : '',
                'dropdown-item'
              ]"
            >
              Sign Out
              <svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </a>
          </MenuItem>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>

<script>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'

export default {
  name: 'UserDropdown',
  components: {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
  },
  props: {
    user: Object,
    boards: Array,
    selectedBoardId: String,
  },
  methods: {
    selectBoard(board) {
      this.$emit('select-board', board);
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

.user-dropdown {
  position: relative;
  display: inline-block;
  font-family: 'Poppins', sans-serif;
}

.user-btn {
  padding: 10px 18px;
  background: #1e1e2d;
  color: #e6e6e9;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
}

.user-btn:hover {
  background: #252535;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.user-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(86, 77, 182, 0.25);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #1a1a27;
  border: 1px solid #2d2d3a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  z-index: 10;
  margin-top: 0.5rem;
  padding: 6px 0;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  padding: 10px 16px;
  text-decoration: none;
  color: #e6e6e9;
  cursor: pointer;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 0.95rem;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-item:hover {
  background: #252535;
  color: #ffffff;
}

.menu-item-active {
  background: #252535;
  color: #ffffff;
  border-left: 3px solid #6366f1;
}

.check-icon {
  width: 18px;
  height: 18px;
  color: #6366f1;
}

.menu-icon {
  width: 18px;
  height: 18px;
  color: #6c6c84;
}

.dropdown-divider {
  height: 1px;
  background-color: #2d2d3a;
  margin: 6px 0;
}

.board-name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collaborator-badge {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 4px;
  background-color: #2a2a3a;
  color: #a0a0b0;
  font-weight: 500;
}
</style>