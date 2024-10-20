// service-worker.js

// Event listener for push notifications
self.addEventListener('push', function(event) {
    console.log('Push received:', event);
  
    // Get the notification data (if available)
    const data = event.data ? event.data.json() : { title: 'Notification', body: 'Default message' };
  
    const options = {
      body: data.body || 'New alarms!',
      icon: data.icon || '/icon.svg',
      badge: data.badge || '/icon_black.svg',
      tag: data.tag || 'notification-tag'
    };
  
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification Title', options)
    );
});
  