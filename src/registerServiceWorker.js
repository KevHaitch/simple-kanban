// This file handles the service worker registration and updates

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      // Handle service worker updates
      if (registration.installing) {
        console.log('Service worker installing')
      } else if (registration.waiting) {
        console.log('Service worker installed but waiting')
      } else if (registration.active) {
        console.log('Service worker active')
      }
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content is available, please refresh.')
          }
        })
      })
      
      // Listen for the controllerchange event to refresh the page when the service worker is updated
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        console.log('Controller changed, refreshing page')
        window.location.reload()
      })
      
      // Handle SKIP_WAITING message from update notification
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING' && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      })
      
      // Enable beforeinstallprompt event for better installation experience
      window.addEventListener('beforeinstallprompt', (event) => {
        // Prevent the mini-infobar from appearing on mobile
        event.preventDefault()
        // Save the event so it can be triggered later
        window.deferredPrompt = event
        console.log('Installation is available')
      })
      
      return registration
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  }
} 