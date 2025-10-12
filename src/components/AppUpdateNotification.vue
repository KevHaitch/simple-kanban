<template>
  <div v-if="showUpdateNotification" class="update-notification">
    <div class="update-content">
      <p>A new version is available!</p>
      <button @click="refreshApp" class="update-button">Update Now</button>
    </div>
  </div>
</template>

<script>
const UPDATE_AVAILABLE_EVENT = 'pwa-update-available'

export default {
  name: 'AppUpdateNotification',
  data() {
    return {
      showUpdateNotification: false,
      updateSW: null
    }
  },
  mounted() {
    // Listen for update available event from main.js
    window.addEventListener(UPDATE_AVAILABLE_EVENT, this.handleUpdateAvailable)
    
    // Also check if there's a waiting service worker on mount (in case update happened before mount)
    this.checkForWaitingServiceWorker()
  },
  beforeUnmount() {
    window.removeEventListener(UPDATE_AVAILABLE_EVENT, this.handleUpdateAvailable)
  },
  methods: {
    handleUpdateAvailable(event) {
      console.log('Update available event received')
      this.updateSW = event.detail?.updateSW || window.__UPDATE_SW__
      this.showUpdateNotification = true
    },
    
    async checkForWaitingServiceWorker() {
      // Check if there's already a waiting service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        if (registration.waiting) {
          console.log('Found waiting service worker on mount')
          this.updateSW = window.__UPDATE_SW__
          this.showUpdateNotification = true
        }
      }
    },
    
    async refreshApp() {
      console.log('Refresh app clicked')
      this.showUpdateNotification = false
      
      // Call the updateSW function provided by vite-plugin-pwa
      if (this.updateSW) {
        console.log('Calling updateSW to activate new service worker')
        await this.updateSW(true) // true = reload page after activation
      } else if (window.__UPDATE_SW__) {
        console.log('Using global updateSW')
        await window.__UPDATE_SW__(true)
      } else {
        // Fallback: just reload the page
        console.log('No updateSW available, doing hard reload')
        window.location.reload()
      }
    }
  }
}
</script>

<style scoped>
.update-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #6366f1;
  color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  max-width: 300px;
  animation: slide-in 0.3s ease-out;
  font-family: 'Poppins', sans-serif;
}

@keyframes slide-in {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.update-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.update-content p {
  margin: 0 0 10px 0;
  font-weight: 500;
}

.update-button {
  background-color: #ffffff;
  color: #6366f1;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.update-button:hover {
  background-color: #f3f3f3;
}
</style> 