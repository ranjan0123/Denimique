self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Denimique", message: event.data.text() };
  }

  const title = payload.title || "Denimique";
  const options = {
    body: payload.message || "",
    // A proper square icon (contain-fit, not stretched) - the site logo is a
    // wide wordmark banner and would look squished/illegible at icon size.
    icon: "/push-icon.png",
    data: { url: payload.url || "/orders" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/orders";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === url && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
