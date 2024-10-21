// service-worker.js

// Event listener for push notifications
self.addEventListener('push', event => {
    console.log('Push received:', event);

    // Get the notification data, with default values if not provided
    const data = event.data?.json() || { title: 'Notification', body: 'Look at me!' };

    const options = {
        body: data.body,
        icon: data.icon || '/icon.svg',
        badge: data.badge || '/icon_black.svg',
        tag: data.tag || 'notification-tag'         // Ensures only one notification of this type is shown at a time
    };

    // Display the notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Event listener for notification click
self.addEventListener('notificationclick', event => {
    event.notification.close(); // Close the notification

    const urlToOpen = self.location.origin; // The root URL of the websit

    event.waitUntil(
        clients.openWindow(urlToOpen) // Open the URL directly in a new window
    );
});