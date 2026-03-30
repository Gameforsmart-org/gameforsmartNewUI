// Service Worker for Push Notifications
// This file must be in the public directory to be served at the root

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notification events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || '',
      icon: data.icon || '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.data?.url || '/',
        ...data.data,
      },
      actions: data.actions || [],
      tag: data.tag || 'default',
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'GameForSmart', options)
    );
  } catch (err) {
    console.error('Push event error:', err);
  }
});

// Handle notification click (body click or action button click)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const action = event.action; // "accept", "decline", or "" (body click)

  // ── Accept button → navigate to the session/action URL ──
  if (action === 'accept') {
    const url = notifData.url || '/notifications';

    // Also update status to "accepted" in DB
    if (notifData.notifId) {
      fetch('/api/push-notifications/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId: notifData.notifId, action: 'accepted' }),
      }).catch((err) => console.error('Accept action failed:', err));
    }

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
    );
    return;
  }

  // ── Decline button → update status to "declined" in DB, no navigation ──
  if (action === 'decline') {
    if (notifData.notifId) {
      event.waitUntil(
        fetch('/api/push-notifications/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifId: notifData.notifId, action: 'declined' }),
        }).catch((err) => console.error('Decline action failed:', err))
      );
    }
    // Don't open any window — just update the DB
    return;
  }

  // ── Body click → navigate to /notifications ──
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate('/notifications');
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/notifications');
      }
    })
  );
});
