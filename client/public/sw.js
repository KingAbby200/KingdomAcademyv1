self.addEventListener('push', function(event) {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: data.data,
      badge: '/notification-badge.png',
      tag: data.tag || 'default',
      actions: data.actions || []
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.notification.data) {
    if (event.notification.data.roomId) {
      event.waitUntil(
        clients.openWindow(`/room/${event.notification.data.roomId}`)
      );
    } else if (event.notification.data.eventId) {
      event.waitUntil(
        clients.openWindow(`/events/${event.notification.data.eventId}`)
      );
    }
  }
});