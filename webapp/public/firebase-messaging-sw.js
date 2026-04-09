
// Scripts for firebase syntax
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "studio-6268493585-ed21f",
  appId: "1:526320518587:web:4a336d97024ee072d0309e",
  apiKey: "AIzaSyDx2uIPPFMKM5-aenLfqVSwU5Devo2PRLo",
  messagingSenderId: "526320518587"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Privacy-first notification strategy: 
  // Never show medication names or specific health data on the lock screen.
  const notificationTitle = payload.notification?.title || 'Jeiva Nudge';
  const notificationOptions = {
    body: payload.notification?.body || 'A new update is available in your clinical dashboard.',
    icon: '/icons/icon-192x192.png',
    tag: 'jeiva-nudge',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
