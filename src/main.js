import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

// Register the service worker for PWA support
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, click on reload button to update.')
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createApp(App).mount('#app')
