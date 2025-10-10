// js/auth.js
import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// register
export async function register(email, password, pseudo) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      pseudo,
      email,
      isVIP: false,
      createdAt: new Date()
    });
    return { ok: true, uid: user.uid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// login
export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// logout
export async function logout() {
  await signOut(auth);
}

// get profile (by uid)
export async function getProfile(uid) {
  const d = await getDoc(doc(db, "users", uid));
  return d.exists() ? d.data() : null;
}

// onAuth state helper
export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}