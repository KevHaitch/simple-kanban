import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

// Create a custom event for update notifications
export const UPDATE_AVAILABLE_EVENT = 'pwa-update-available'
export const UPDATE_SW_CALLBACK = 'pwa-update-callback'

// Register the service worker for PWA support
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, dispatching update event...')
    // Dispatch custom event that the AppUpdateNotification component can listen for
    window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT, {
      detail: { updateSW }
    }))
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  immediate: true
})

// Store the updateSW function globally so the component can call it
window.__UPDATE_SW__ = updateSW

createApp(App).mount('#app')
