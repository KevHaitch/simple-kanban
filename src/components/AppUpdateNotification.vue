<template>
  <div v-if="showUpdateNotification" class="update-notification">
    <div class="update-content">
      <p>A new version is available!</p>
      <button @click="refreshApp" class="update-button">Update Now</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppUpdateNotification',
  data() {
    return {
      showUpdateNotification: false,
      registration: null,
      updateCheckCompleted: false
    }
  },
  mounted() {
    // Delay the update check to avoid update loops
    setTimeout(() => {
      this.registerUpdateEvent()
    }, 3000)
  },
  methods: {
    registerUpdateEvent() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          this.registration = registration
          
          // Only check for waiting worker once
          if (registration.waiting && !this.updateCheckCompleted) {
            this.showUpdateNotification = true
            this.updateCheckCompleted = true
          }
          
          // Listen for new updates
          registration.addEventListener('updatefound', () => {
            if (this.updateCheckCompleted) return
            
            const newWorker = registration.installing
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification = true
                this.updateCheckCompleted = true
              }
            })
          })
        })
      }
    },
    refreshApp() {
      if (this.registration && this.registration.waiting) {
        // Send message to service worker to skip waiting and activate new version
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      
      // Reload the page to load new version
      window.location.reload()
      this.showUpdateNotification = false
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