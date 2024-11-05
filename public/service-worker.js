// service-worker.js

// Cache names
const CACHE_NAME = 'my-app-cache-v1';
const URLS_TO_CACHE = [
    '/',  // The main page
    '/index.html',  // Adjust if you have an index file
    '/icon-192x192.png',  // Your app icon
    '/icon-512x512.png',  // Your app icon
    '/icon.svg',  // Additional icons
    '/icon_black.svg',  // Additional icons
    // Add other necessary files and assets here
];

// Install event to cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app shell');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Fetch event to serve cached files
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If there's a cached response, return it; otherwise fetch from the network
                return response || fetch(event.request);
            })
    );
});

// Event listener for push notifications
self.addEventListener('push', event => {
    console.log('Push received:', event);
    
    const data = event.data?.json() || { title: 'Notification', body: 'Look at me!' };

    const options = {
        body: data.body,
        icon: data.icon || '/icon.svg',
        badge: data.badge || '/icon_black.svg',
        tag: data.tag || 'notification-tag' // Ensures only one notification of this type is shown at a time
    };

    // Display the notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Event listener for notification click
self.addEventListener('notificationclick', event => {
    event.notification.close(); // Close the notification

    // The URL of the PWA (can adjust to a specific path within your app)
    const urlToOpen = self.location.origin; 

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Try to find an existing client (PWA window) that's open
            const client = clientList.find(client => client.url === urlToOpen && client.visible);

            if (client) {
                // If the PWA is already open, focus on it
                return client.focus();
            } else {
                // Otherwise, open a new window/tab for the PWA
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
