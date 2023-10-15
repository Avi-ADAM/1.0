/*import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";
//importScripts('https://www.gstatic.com/firebasejs/9.1.0/firebase-app-compat.js');
//importScripts('https://www.gstatic.com/firebasejs/9.1.0/firebase-messaging-compat.js');
// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
//import {
//    initializeApp
//} from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
//
//import {
//    getMessaging,
//    onBackgroundMessage
//} from "https://www.gstatic.com/firebasejs/9.1.2/firebase-messaging-sw.js";
 
const firebaseApp = initializeApp({
 apiKey: "AIzaSyAq9ZNUsrrUw-mHmi8jCjkmcDdR6PpLpLc",
  authDomain: "lev1-9ad4a.firebaseapp.com",
  projectId: "lev1-9ad4a",
  storageBucket: "lev1-9ad4a.appspot.com",
  messagingSenderId: "30082803372",
  appId: "1:30082803372:web:685ddb1486f76123b2a109",
  measurementId: "G-G3F3SSVCKL"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.

import { onBackgroundMessage } from "firebase/messaging/sw";

const messaging = getMessaging(firebaseApp);
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});*/
/*
importScripts('https://www.gstatic.com/firebasejs/8.1.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.1.1/firebase-messaging.js');
 import firebase from '$lib/func/firebase';

 const app = firebase();
const messaging = app.messaging();
messaging.onBackgroundMessage((payload) => {
console.log('[firebase-messaging-sw.js] Received background message ', payload);
const notificationTitle = payload.notification.title;
const notificationOptions = {
body: payload.notification.body,
};
return self.registration.showNotification(notificationTitle,
notificationOptions);
});
self.addEventListener('notificationclick', event => {
   console.log(event)
});*/