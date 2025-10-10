// js/firebase.js
// Initialisation Firebase (ES modules via CDN).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnDW725laagCdj0INT9gaA2z0FsLn6cO4",
  authDomain: "defi-amis-plus.firebaseapp.com",
  databaseURL: "https://defi-amis-plus-default-rtdb.firebaseio.com",
  projectId: "defi-amis-plus",
  storageBucket: "defi-amis-plus.firebasestorage.app",
  messagingSenderId: "714241330241",
  appId: "1:714241330241:web:b927c37c0d511e66f64ac0",
  measurementId: "G-M7NZ9KGW42"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);