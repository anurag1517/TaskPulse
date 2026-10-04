// Immediately take control of clients
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let payload = { title: 'TaskPulse Reminder', body: 'You have a pending task!' };
    try {
        if (event.data) {
            payload = event.data.json();
        }
    } catch {
        payload.body = event.data.text();
    }

    let body = payload.body;
    // Format scheduled time in the user's local device timezone if ISO time is provided
    if (payload.data && payload.data.time) {
        try {
            const taskTime = new Date(payload.data.time);
            if (!isNaN(taskTime.getTime())) {
                const formattedTime = taskTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                body = payload.data.loc
                    ? `Location: ${payload.data.loc}. Scheduled: ${formattedTime}`
                    : `Scheduled for: ${formattedTime}`;
            }
        } catch (e) {
            console.error('[SW] Failed to format task time:', e);
        }
    }

    const options = {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
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
