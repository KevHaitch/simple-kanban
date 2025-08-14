<template>
  <div class="user-dropdown">
    <Menu as="div" class="relative inline-block text-left">
      <div>
        <MenuButton class="user-btn">
          <img 
            v-if="user.photoURL" 
            :src="user.photoURL" 
            :alt="user.displayName || user.email"
            class="user-avatar"
            @error="onAvatarError"
          />
          <div v-else class="user-avatar-fallback">
            {{ getUserInitials() }}
          </div>
          <span v-if="getShortName()" class="user-name">{{ getShortName() }}</span>
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
              @click.prevent="handleNewProject"
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
          <MenuItem v-if="selectedBoard" v-slot="{ active }">
            <a 
              @click.prevent="handleEditProject"
              :class="[
                active ? 'menu-item-active' : '',
                'dropdown-item'
              ]"
            >
              Project Settings
              <svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </a>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <a 
              @click.prevent="handleSignOut"
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
    selectedBoard: Object,
  },
  emits: ['select-board', 'new-project', 'edit-project', 'sign-out'],
  methods: {
    selectBoard(board) {
      this.$emit('select-board', board);
    },
    onAvatarError() {
      // Avatar failed to load, will show fallback
    },
    getUserInitials() {
      if (this.user.displayName) {
        return this.user.displayName
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase()
          .substring(0, 2);
      }
      if (this.user.email) {
        return this.user.email.charAt(0).toUpperCase();
      }
      return 'U';
    },
    getShortName() {
      if (this.user.displayName) {
        return this.user.displayName.split(' ')[0];
      }
      if (this.user.email) {
        return this.user.email.split('@')[0];
      }
      return '';
    },
    handleNewProject() {
      this.$emit('new-project');
    },
    handleEditProject() {
      this.$emit('edit-project', this.selectedBoard);
    },
    handleSignOut() {
      this.$emit('sign-out');
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
  height: 40px;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 0;
  background-color: #252535;
  border: 3px solid #2d2d3a;
  border-radius: 20px;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.user-btn:hover {
  background-color: #2a2a3e;
  border-color: #3a3a4e;
}

.user-btn:focus {
  outline: none;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c6c84;
  font-weight: 600;
  font-size: 1rem;
}

.user-name {
  color: #6c6c84;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0 12px;
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