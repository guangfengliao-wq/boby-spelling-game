// Executed by Android even when an old Service Worker served the page.
// Only remove application resource caches. Never clear learning data or localStorage.
(async () => {
  const registrations = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.getRegistrations() : [];
  const controlled = Boolean(navigator.serviceWorker?.controller);
  await Promise.all(registrations.map(registration => registration.unregister()));
  const keys = 'caches' in window ? await caches.keys() : [];
  const obsolete = keys.filter(key => key.startsWith('workbox-') || key === 'html-cache');
  await Promise.all(obsolete.map(key => caches.delete(key)));
  if (registrations.length || controlled || obsolete.length) location.reload();
})().catch(error => console.error('Native resource cache cleanup failed', error));
