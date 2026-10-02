// TaskPulse Service Worker for Push Notifications

self.addEventListener('push', (event) => {
    let payload = { title: 'TaskPulse Reminder', body: 'You have a pending task!' };
    try {
        if (event.data) {
            payload = event.data.json();
        }
    } catch {
        payload.body = event.data.text();
    }

    const options = {
        body: payload.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        data: payload.data,
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
